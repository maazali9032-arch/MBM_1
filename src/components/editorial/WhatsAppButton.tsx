import { siteContent } from '../../data/site';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

export const WhatsAppButton = () => {
  const number = siteContent.business.phone.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${number}?text=Hi,%20I'm%20interested%20in%20your%20clothing%20collections%20at%20MAHEK.`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with MAHEK on WhatsApp"
      className="whatsapp-fab fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] rounded-full shadow-lg text-white hover:scale-110 active:scale-95 transition-all duration-300 group cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
    >
      <WhatsAppIcon className="w-7 h-7" />
    </a>
  );
};
