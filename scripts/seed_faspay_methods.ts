import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

const LOGOS: Record<string, string> = {
  bca: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg",
  bni: "https://upload.wikimedia.org/wikipedia/id/5/55/BNI_logo.svg",
  bri: "https://upload.wikimedia.org/wikipedia/commons/6/68/BANK_BRI_logo.svg",
  mandiri: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg",
  bsi: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg",
  btn: "https://upload.wikimedia.org/wikipedia/commons/0/07/Bank_BTN_logo.svg",
  cimb: "https://upload.wikimedia.org/wikipedia/commons/5/59/CIMB_Bank_logo.svg",
  danamon: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Danamon_logo.svg",
  permata: "https://upload.wikimedia.org/wikipedia/commons/2/27/PermataBank.svg",
  maybank: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Maybank_Logo.svg",
  sinarmas: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Bank_Sinarmas_logo.svg",
  shopee: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg",
  ovo: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg",
  linkaja: "https://upload.wikimedia.org/wikipedia/commons/8/85/LinkAja.svg",
  qris: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg",
  indomaret: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Logo_Indomaret.svg",
  alfa: "https://upload.wikimedia.org/wikipedia/commons/9/9e/Alfamart_Logo.svg",
};

interface FaspayChannelItem {
  code: string;
  name: string;
  type: "va" | "qr_code" | "e_wallet" | "retail_outlet";
  logo: string;
  sortOrder: number;
}

const FASPAY_CHANNELS: FaspayChannelItem[] = [
  { code: "FASPAY_702", name: "BCA Virtual Account (Faspay)", type: "va", logo: LOGOS.bca, sortOrder: 50 },
  { code: "FASPAY_801", name: "BNI Virtual Account (Faspay)", type: "va", logo: LOGOS.bni, sortOrder: 51 },
  { code: "FASPAY_800", name: "BRI Virtual Account (Faspay)", type: "va", logo: LOGOS.bri, sortOrder: 52 },
  { code: "FASPAY_802", name: "Mandiri Virtual Account (Faspay)", type: "va", logo: LOGOS.mandiri, sortOrder: 53 },
  { code: "FASPAY_723", name: "BSI Virtual Account (Faspay)", type: "va", logo: LOGOS.bsi, sortOrder: 54 },
  { code: "FASPAY_837", name: "BTN Virtual Account (Faspay)", type: "va", logo: LOGOS.btn, sortOrder: 55 },
  { code: "FASPAY_825", name: "CIMB VA (Faspay)", type: "va", logo: LOGOS.cimb, sortOrder: 56 },
  { code: "FASPAY_708", name: "Danamon VA (Faspay)", type: "va", logo: LOGOS.danamon, sortOrder: 57 },
  { code: "FASPAY_402", name: "Permata VA (Faspay)", type: "va", logo: LOGOS.permata, sortOrder: 58 },
  { code: "FASPAY_408", name: "Maybank VA (Faspay)", type: "va", logo: LOGOS.maybank, sortOrder: 59 },
  { code: "FASPAY_818", name: "Sinarmas VA (Faspay)", type: "va", logo: LOGOS.sinarmas, sortOrder: 60 },
  { code: "FASPAY_718", name: "BNC VA (Faspay)", type: "va", logo: LOGOS.bca, sortOrder: 61 },
  { code: "FASPAY_844", name: "Blu by BCA (Faspay)", type: "va", logo: LOGOS.bca, sortOrder: 62 },
  { code: "FASPAY_711", name: "ShopeePay QRIS (Faspay)", type: "qr_code", logo: LOGOS.qris, sortOrder: 63 },
  { code: "FASPAY_836", name: "Paydia QRIS (Faspay)", type: "qr_code", logo: LOGOS.qris, sortOrder: 64 },
  { code: "FASPAY_713", name: "ShopeePay App (Faspay)", type: "e_wallet", logo: LOGOS.shopee, sortOrder: 65 },
  { code: "FASPAY_812", name: "OVO (Faspay)", type: "e_wallet", logo: LOGOS.ovo, sortOrder: 66 },
  { code: "FASPAY_302", name: "LinkAja (Faspay)", type: "e_wallet", logo: LOGOS.linkaja, sortOrder: 67 },
  { code: "FASPAY_716", name: "LinkAja App (Faspay)", type: "e_wallet", logo: LOGOS.linkaja, sortOrder: 68 },
  { code: "FASPAY_706", name: "Indomaret (Faspay)", type: "retail_outlet", logo: LOGOS.indomaret, sortOrder: 69 },
  { code: "FASPAY_707", name: "ALFAGROUP (Faspay)", type: "retail_outlet", logo: LOGOS.alfa, sortOrder: 70 },
];

async function main() {
  console.log("Seeding Faspay payment methods...");

  for (const ch of FASPAY_CHANNELS) {
    const existing = await sql`SELECT id FROM payment_methods WHERE code = ${ch.code}`;
    if (existing.length > 0) {
      await sql`
        UPDATE payment_methods
        SET name = ${ch.name},
            type = ${ch.type},
            provider = 'faspay',
            logo_url = ${ch.logo},
            sort_order = ${ch.sortOrder},
            is_active = TRUE,
            updated_at = NOW()
        WHERE code = ${ch.code}
      `;
      console.log(`Updated: ${ch.name}`);
    } else {
      const rows = await sql`
        INSERT INTO payment_methods (
          code, name, type, provider, logo_url, admin_fee_flat, admin_fee_pct, is_active, is_redirect, sort_order
        ) VALUES (
          ${ch.code}, ${ch.name}, ${ch.type}, 'faspay', ${ch.logo}, 0, '0', TRUE, FALSE, ${ch.sortOrder}
        ) RETURNING id
      `;
      const methodId = rows[0].id;
      // Add default instruction
      let instr = "<ol><li>Selesaikan pembayaran sesuai instruksi yang muncul di layar.</li><li>Pesanan kursus kamu akan otomatis terverifikasi.</li></ol>";
      if (ch.type === "va") {
        instr = "<ol><li>Salin nomor Virtual Account yang tertera.</li><li>Buka aplikasi m-Banking atau ATM bank pilihanmu.</li><li>Pilih menu Transfer > Virtual Account lalu masukkan nomor VA.</li><li>Konfirmasi nominal dan selesaikan transaksi.</li></ol>";
      } else if (ch.type === "qr_code") {
        instr = "<ol><li>Buka aplikasi mobile banking atau e-wallet (BCA, GoPay, OVO, Dana, ShopeePay, dsb).</li><li>Pilih menu Scan / Bayar QRIS.</li><li>Pindai QR Code di layar dan konfirmasi pembayaran.</li></ol>";
      }
      await sql`
        INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
        VALUES (${methodId}, 'Cara Pembayaran', ${instr}, 1)
      `;
      console.log(`Inserted: ${ch.name}`);
    }
  }

  console.log("Faspay payment methods successfully seeded!");
}

main().catch(console.error);
