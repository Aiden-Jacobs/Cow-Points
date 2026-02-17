class User_nav_bar extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.innerHTML = `<nav>
                    <ul id="nav-bar">
                        <li><a href="user_dashboard.html">Dashboard</a></li>
                        <li><a href="points.html">Points</a></li>
                        <li><a href="friends.html">Friends</a></li>
                        <!-- <li><a href="#add-point">Add Point</a></li> -->
                        <!-- <li><a href="user_settings.html">Settings</a></li> -->
                        <!-- Notification Bell -->
                        <li style="position: relative; display: inline-block;">
                            <div id="notification-icon" style="cursor: pointer; position: relative; margin-left: 20px;">
                                🔔
                                <span id="notification-badge" style="
                                    display: none; 
                                    position: absolute; 
                                    top: -5px; 
                                    right: -10px; 
                                    background-color: red; 
                                    color: white; 
                                    border-radius: 50%; 
                                    padding: 2px 6px; 
                                    font-size: 10px;
                                ">0</span>
                            </div>
                            <!-- Notification Dropdown -->
                            <div id="notification-dropdown" style="
                                display: none; 
                                position: absolute; 
                                top: 30px; 
                                right: 0; 
                                background-color: white; 
                                border: 1px solid #ccc; 
                                border-radius: 5px; 
                                width: 300px; 
                                max-height: 400px; 
                                overflow-y: auto; 
                                box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
                                z-index: 1000;
                            ">
                                <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                                    <strong>Notifications</strong>
                                    <button id="mark-all-read" style="font-size: 10px; cursor: pointer;">Mark all read</button>
                                </div>
                                <ul id="notification-list" style="list-style: none; padding: 0; margin: 0;">
                                    <li style="padding: 10px; text-align: center; color: #888;">No notifications</li>
                                </ul>
                            </div>
                        </li>
                    </ul>
                </nav>`;

    this.initializeNotifications();
  }

  async initializeNotifications() {
    const { supabase } = await import('../utils/supabaseClient.js');
    const { getNotifications, getUnreadCount, markAsRead, markAllAsRead } = await import('../services/notificationService.js');

    const session = await supabase.auth.getSession();
    if (!session.data.session) return;
    const userId = session.data.session.user.id;

    const icon = this.querySelector('#notification-icon');
    const badge = this.querySelector('#notification-badge');
    const dropdown = this.querySelector('#notification-dropdown');
    const list = this.querySelector('#notification-list');
    const markAllBtn = this.querySelector('#mark-all-read');

    // Toggle dropdown
    icon.addEventListener('click', async () => {
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) {
        await this.loadNotifications(userId, list, getNotifications, markAsRead);
      }
    });

    // Mark all as read
    markAllBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await markAllAsRead(userId);
      this.updateBadge(userId, badge, getUnreadCount);
      await this.loadNotifications(userId, list, getNotifications, markAsRead);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!icon.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    // Periodic check for new notifications (e.g. every minute)
    this.updateBadge(userId, badge, getUnreadCount);
    setInterval(() => this.updateBadge(userId, badge, getUnreadCount), 60000);
  }

  async updateBadge(userId, badge, getUnreadCount) {
    const count = await getUnreadCount(userId);
    if (count > 0) {
      badge.style.display = 'block';
      badge.textContent = count > 99 ? '99+' : count;
    } else {
      badge.style.display = 'none';
    }
  }

  async loadNotifications(userId, list, getNotifications, markAsRead) {
    const notifications = await getNotifications(userId);
    list.innerHTML = '';

    if (notifications.length === 0) {
      list.innerHTML = '<li style="padding: 10px; text-align: center; color: #888;">No notifications</li>';
      return;
    }

    notifications.forEach(note => {
      const li = document.createElement('li');
      li.style.padding = '10px';
      li.style.borderBottom = '1px solid #eee';
      li.style.backgroundColor = note.is_read ? 'white' : '#f0f8ff'; // Highlight unread
      li.style.cursor = 'pointer';

      const text = document.createElement('div');
      text.textContent = note.content;

      const time = document.createElement('div');
      time.style.fontSize = '0.8em';
      time.style.color = '#888';
      time.textContent = new Date(note.created_at).toLocaleString();

      li.appendChild(text);
      li.appendChild(time);

      li.addEventListener('click', async () => {
        if (!note.is_read) {
          await markAsRead(note.id);
          note.is_read = true;
          li.style.backgroundColor = 'white';
          this.updateBadge(userId, this.querySelector('#notification-badge'), () => Promise.resolve(0)); // quick hack to clear badge purely visual until next fetch
        }

        if (note.type === 'friend_request') {
          window.location.href = 'friends.html';
        }
      });

      list.appendChild(li);
    });
  }
}

customElements.define('user-nav-bar', User_nav_bar);


// added the code below for a future responsive design for the user nav bar
// This code is commented out as it is not currently in use, but can be used for a responsive design in the future.

// class User_nav_bar extends HTMLElement {
//   constructor() {
//       super();
//   }

//   connectedCallback() {
//       this.innerHTML = `
//           <style>
//               nav {
//                   position: relative;
//               }

//               .menu-toggle {
//                   display: none;
//                   background: none;
//                   border: none;
//                   font-size: 1.5rem;
//                   position: absolute;
//                   right: 10px;
//                   top: 10px;
//               }

//               #nav-bar {
//                   list-style-type: none;
//                   padding: 0;
//                   margin: 0;
//                   display: flex;
//                   gap: 15px;
//               }

//               #nav-bar li {
//                   display: inline;
//               }

//               @media (max-width: 768px) {
//                   .menu-toggle {
//                       display: block;
//                   }

//                   #nav-bar {
//                       display: none;
//                       flex-direction: column;
//                       background: #f9f9f9;
//                       position: absolute;
//                       top: 40px;
//                       right: 0;
//                       width: 100%;
//                       box-shadow: 0 4px 8px rgba(0,0,0,0.1);
//                   }

//                   #nav-bar.show {
//                       display: flex;
//                   }

//                   #nav-bar li {
//                       padding: 10px;
//                       text-align: center;
//                       display: block;
//                   }
//               }
//           </style>
//           <nav>
//               <button class="menu-toggle" aria-label="Toggle menu">&#9776;</button>
//               <ul id="nav-bar">
//                   <li><a href="user_dashboard.html">Dashboard</a></li>
//                   <li><a href="points.html">Points</a></li>
//                   <li><a href="friends.html">Friends</a></li>
//                   <!-- <li><a href="#add-point">Add Point</a></li> -->
//                   <!-- <li><a href="user_settings.html">Settings</a></li> -->
//               </ul>
//           </nav>
//       `;

//       this.querySelector('.menu-toggle').addEventListener('click', () => {
//           const navBar = this.querySelector('#nav-bar');
//           navBar.classList.toggle('show');
//       });
//   }
// }

// customElements.define('user-nav-bar', User_nav_bar);
