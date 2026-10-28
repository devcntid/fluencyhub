export function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function generateQrisString({
  orderNumber,
  amount,
  merchantName = "FluencyHub",
}: {
  orderNumber: string;
  amount: number;
  merchantName?: string;
}): string {
  const pad = (id: string, val: string) =>
    id + String(val.length).padStart(2, "0") + val;
  const merchantInfo = pad("00", "ID.CO.QRIS.WWW") + pad("01", orderNumber);
  const tag26 = pad("26", merchantInfo);
  const tag51 = pad(
    "51",
    pad("00", "ID.CO.QRIS.WWW") + pad("02", "ID1020021650348")
  );
  const tag62 = pad("62", pad("01", orderNumber));

  const raw =
    pad("00", "01") +
    pad("01", "12") +
    tag26 +
    tag51 +
    pad("52", "5812") +
    pad("53", "360") +
    pad("54", String(Math.round(amount))) +
    pad("58", "ID") +
    pad("59", merchantName) +
    pad("60", "JAKARTA") +
    pad("61", "12340") +
    tag62 +
    "6304";
  const checksum = crc16(raw);
  return raw + checksum;
}
