import { describe, expect, it } from 'vitest';
import { callLink, whatsappLink } from './contact-links';
describe('configured contact actions',()=>{
 it('enables only valid configured call and WhatsApp links',()=>{expect(callLink('+919876543210')).toBe('tel:+919876543210');expect(whatsappLink('+919876543210')).toBe('https://wa.me/919876543210');expect(callLink(null)).toBeNull();expect(whatsappLink(null)).toBeNull();expect(callLink('demo-phone')).toBeNull();expect(whatsappLink('javascript:alert(1)')).toBeNull();});
});
