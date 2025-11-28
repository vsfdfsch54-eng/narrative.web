"use client";

import { motion } from "framer-motion";
import { Home, MessageCircle, Calendar, User, Bell } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const items = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Chat", icon: MessageCircle, href: "/conversations" },
    { label: "Notifications", icon: Bell, href: "/notifications" },
    { label: "Calendar", icon: Calendar, href: "/calendar" },
    { label: "Profile", icon: User, href: "/profile" },
  ];

  // Only show on specific pages: home, match, chat, notifications, calendar, and profile
  const allowedPaths = ['/', '/match', '/conversations', '/chat', '/notifications', '/calendar', '/profile']
  const isAllowedPath = pathname && (
    allowedPaths.some(path => pathname === path || pathname.startsWith(path + '/'))
  )

  if (!isAllowedPath) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50 pointer-events-none" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
      <div className="pointer-events-auto flex items-center gap-4 px-6 py-3 rounded-3xl bg-black/60 backdrop-blur-xl shadow-2xl border border-white/5">
        {items.map((item) => {
          // For chat/conversations, check if we're on conversations or chat pages
          const selected = item.href === '/conversations' 
            ? (pathname === '/conversations' || pathname?.startsWith('/chat/'))
            : pathname === item.href;
          const Icon = item.icon;

              // Special handling for notifications with badge
              const isNotifications = item.href === '/notifications';
              const showBadge = isNotifications && unreadCount > 0;

              return (
            <motion.button
                  key={item.href}
              onClick={() => router.push(item.href)}
              whileTap={{ scale: 0.92 }}
                  className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all relative",
                selected
                  ? "bg-white text-black shadow-md"
                  : "bg-white/10 text-white hover:bg-white/20"
                  )}
            >
              <div className="relative">
                <Icon size={18} />
                {showBadge && (
                  <div 
                    className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-[#FF3B30] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md"
                    style={{ 
                      backgroundColor: '#FF3B30', // iOS red
                      lineHeight: '1',
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
              {selected && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                >
                  {item.label}
                </motion.span>
                  )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
