export function callLink(phone: string | null) { return phone && /^\+[1-9]\d{7,14}$/.test(phone) ? `tel:${phone}` : null; }
export function whatsappLink(phone: string | null) { return phone && /^\+[1-9]\d{7,14}$/.test(phone) ? `https://wa.me/${phone.slice(1)}` : null; }
