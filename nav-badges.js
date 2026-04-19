(function () {
    async function updateNavBadges() {
        const token = localStorage.getItem('laoverse_jwt');
        if (!token) return;

        try {
            // 1. จัดการ Badge สำหรับการแจ้งเตือน (Note)
            const notifResponse = await fetch(`${window.API_BASE_URL}/get-notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const notifData = await notifResponse.json();

            if (notifData.success) {
                const isNotePage = window.location.pathname.includes('note.html');
                // นับเฉพาะอันที่ยังไม่อ่าน
                const unreadNotifs = notifData.notifications ? notifData.notifications.filter(n => !n.is_read).length : 0;

                // ถ้าอยู่หน้า Note ให้ล้าง Badge ทันที
                updateBadge('nav-note-badge', isNotePage ? 0 : unreadNotifs);
            }

            // 2. จัดการ Badge สำหรับข้อความ (Message)
            const friendsResponse = await fetch(`${window.API_BASE_URL}/get_friends`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const friendsData = await friendsResponse.json();

            if (friendsData.success) {
                const isMessagePage = window.location.pathname.includes('message.html');
                const totalUnreadMsg = friendsData.friends ? friendsData.friends.reduce((sum, f) => sum + (f.unread_count || 0), 0) : 0;

                updateBadge('nav-message-badge', isMessagePage ? 0 : totalUnreadMsg);
            }
        } catch (error) {
            console.error('Badge update error:', error);
        }
    }

    function updateBadge(id, count) {
        let badge = document.getElementById(id);
        const navLinks = document.querySelectorAll('.main-nav a');
        let targetLink = null;

        if (id === 'nav-note-badge') {
            targetLink = Array.from(navLinks).find(a => a.getAttribute('href') === 'note.html');
        } else if (id === 'nav-message-badge') {
            targetLink = Array.from(navLinks).find(a => a.getAttribute('href') === 'message.html');
        }

        if (!targetLink) return;

        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.id = id;
                badge.className = 'nav-badge';
                targetLink.style.position = 'relative';
                targetLink.appendChild(badge);
            }
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        } else if (badge) {
            badge.style.display = 'none';
        }
    }

    // สไตล์ Badge (Support Theme)
    if (!document.getElementById('nav-badge-style')) {
        const style = document.createElement('style');
        style.id = 'nav-badge-style';
        style.textContent = `
            .nav-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background-color: #ff4444;
                color: white;
                border-radius: 50%;
                padding: 2px;
                font-size: 10px;
                font-weight: bold;
                min-width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 8px rgba(255, 68, 68, 0.6);
                border: 1.5px solid var(--black, #000);
                z-index: 100;
                pointer-events: none;
            }
            @media (max-width: 768px) {
                .nav-badge { top: 1px; right: 1px; min-width: 14px; height: 14px; font-size: 8px; }
            }
        `;
        document.head.appendChild(style);
    }

    document.addEventListener('DOMContentLoaded', updateNavBadges);
    setInterval(updateNavBadges, 15000); // อัปเดตทุก 15 วินาที
})();
