import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getCertificateByCode } from "@/lib/db/certificates.queries";
import { CertificateViewer } from "./CertificateViewer";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { code } = await params;
  const { view } = await searchParams;
  const certificate = await getCertificateByCode(code);

  if (!certificate) {
    return {
      title: "Sertifikat Tidak Ditemukan — FluencyHub",
    };
  }

  const cleanStudent = certificate.studentName.replace(/[/\\?%*:|"<>]/g, "").trim();
  const cleanCourse = certificate.courseTitle.replace(/[/\\?%*:|"<>]/g, "").trim();
  const isReport = view === "report";

  return {
    title: isReport
      ? `Rapor Nilai - ${cleanStudent} - ${cleanCourse}`
      : `Sertifikat - ${cleanStudent} - ${cleanCourse}`,
    description: `Dokumen resmi ${
      isReport ? "Rapor Nilai Akademik" : "Sertifikat Kelulusan"
    } siswa ${certificate.studentName} untuk kursus ${certificate.courseTitle} di FluencyHub Academy.`,
  };
}

export default async function CertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { code } = await params;
  const { view } = await searchParams;

  const certificate = await getCertificateByCode(code);
  if (!certificate) {
    notFound();
  }

  // Generate QR Code data URL dynamically
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://fluencyhub-theta.vercel.app");
  const validationUrl = `${baseUrl}/certificates/${certificate.certificateCode}`;
  const qrDataUrl = await QRCode.toDataURL(validationUrl, {
    margin: 1,
    width: 140,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  return (
    <CertificateViewer
      certificate={{
        id: certificate.id,
        certificateCode: certificate.certificateCode,
        studentName: certificate.studentName,
        courseTitle: certificate.courseTitle,
        instructorName: certificate.instructorName,
        instructorSignatureUrl: certificate.instructorSignatureUrl,
        finalScore: certificate.finalScore,
        grade: certificate.grade,
        readingScore: certificate.readingScore,
        listeningScore: certificate.listeningScore,
        writingScore: certificate.writingScore,
        speakingScore: certificate.speakingScore,
        issuedAt: certificate.issuedAt.toISOString(),
        qrDataUrl,
      }}
      initialView={view === "report" ? "report" : "certificate"}
    />
  );
}
