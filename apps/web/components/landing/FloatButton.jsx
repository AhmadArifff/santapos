import { ctaContent } from '@/data/landing/ctaContent';

const chatBubbleIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6 18L3 21V5.5C3 4.67 3.67 4 4.5 4H19.5C20.33 4 21 4.67 21 5.5V16.5C21 17.33 20.33 18 19.5 18H6Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="8" cy="11" r="1.1" fill="currentColor" />
    <circle cx="12" cy="11" r="1.1" fill="currentColor" />
    <circle cx="16" cy="11" r="1.1" fill="currentColor" />
  </svg>
);

export default function FloatButton({ content = { whatsappUrl: ctaContent.whatsappUrl }, previewMode = false }) {
  const data = content || { whatsappUrl: ctaContent.whatsappUrl };
  const icon = data.icon;
  const showChatIcon = !icon || icon === 'Chat' || icon === '💬';

  return (
    <a
      href={data.whatsappUrl}
      className="float-btn"
      target="_blank"
      rel="noreferrer"
      aria-label={data.ariaLabel || 'Pesan via WhatsApp'}
      onClick={(e) => {
        if (previewMode) e.preventDefault();
      }}
    >
      {showChatIcon ? chatBubbleIcon : icon}
    </a>
  );
}
