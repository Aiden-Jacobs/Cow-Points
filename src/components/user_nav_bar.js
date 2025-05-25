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
                    </ul>
                </nav>`;
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
