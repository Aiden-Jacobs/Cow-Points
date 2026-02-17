/**
 * Randomly select and set an image for the background so that the page has random backgrounds of cows
 * @returns {void}
 */
export function setRandomBackground() {
    const backgroundImages = [
        '../../Assets/Art/jpg/snow_cow.jpg',
        '../../Assets/Art/jpg/storm_cow.jpg',
        '../../Assets/Art/jpg/fall_cow.jpg',
        '../../Assets/Art/jpg/fall1_cow.jpg',
        '../../Assets/Art/jpg/openart-image_-xUOUzzX_1733088256941_raw.jpg',
        '../../Assets/Art/jpg/sunset_cow2.jpg',
        '../../Assets/Art/jpg/sunset_cow3.jpg',
        '../../Assets/Art/jpg/sunset_cow4.jpg',
        '../../Assets/Art/jpg/stars_cow1.jpg',
        '../../Assets/Art/jpg/stars_cow2.jpg',
        '../../Assets/Art/jpg/rainbow_cow1.jpg',
        '../../Assets/Art/jpg/rainbow_cow2.jpg',
        '../../Assets/Art/jpg/Tile_cow2.jpg',
        '../../Assets/Art/jpg/cows_in_the_planes.png',
        '../../Assets/Art/jpg/Tile_cow1.jpg',
    ];
    const randomIndex = Math.floor(Math.random() * backgroundImages.length);
    document.body.style.background = `url('${backgroundImages[randomIndex]}') center center fixed`;
}


/**
 * this function adds the user profile and log out buttons to the header when the user is logged in
 * @param {Object} supabase_session
 * @returns {void}
 */
export async function add_header_buttons(supabase_session) {
    try {
        let session = await supabase_session.auth.getSession();
        console.log("session", session);
        if (session.data.session !== null) {
            // gets the sign in button so that it can be changed to the user profile button when the user is logged in
            const button = document.getElementById("sign-in");
            const link = document.getElementById("sign-in-link");
            button.textContent = "User Profile";
            link.href = "user_dashboard.html";
            button.classList.remove("sign-in-button");
            button.classList.add("user-profile-button");
            // create the log out button when the user is logged in so that they can log out
            const logoutButton = document.createElement("button");
            logoutButton.textContent = "LOG OUT";
            logoutButton.classList.add("header-button");
            logoutButton.id = "log-out";
            logoutButton.onclick = async () => {
                await supabase_session.auth.signOut();
                window.location.reload();
            }
            // this adds the log out button to the header so that it is visible when the user is logged in
            document.getElementById("header-button-container").appendChild(logoutButton);
        }
    } catch (error) {
        console.error("user not logged in");
    }
    // print the url to the console so that it can be used for debugging
    console.log("url", window.location.href);
    if (window.location.href.includes("rules.html")) {
        // add buttons to the rules page to navigate to the the leaderboard
        const leaderboardButton = document.createElement("button");
        leaderboardButton.textContent = "Leaderboard";
        leaderboardButton.classList.add("header-button");
        leaderboardButton.id = "leaderboard-button";
        leaderboardButton.onclick = () => {
            window.location.href = "index.html";
        }
        // this adds the leaderboard button to the header so that it is visible when the user is logged in
        document.getElementById("header-button-container").appendChild(leaderboardButton);
    }

    if (window.location.href.includes("contact.html") || window.location.href.includes("status.html")) {
        // add buttons to the contact page to navigate to the the homepage
        const homeButton = document.createElement("button");
        homeButton.textContent = "LEADERBOARD";
        homeButton.classList.add("header-button");
        homeButton.id = "home-button";
        homeButton.onclick = () => {
            window.location.href = "index.html";
        }
        // this adds the home button to the header so that it is visible when the user is logged in
        document.getElementById("header-button-container").appendChild(homeButton);
    }
}

/**
 * Loads the footer content into the footer-container element.
 * @returns {Promise<void>}
 */
export async function loadFooter() {
    try {
        const response = await fetch('src/components/footer.html');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const footerHTML = await response.text();
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            footerContainer.innerHTML = footerHTML;
        } else {
            console.error('Footer container not found');
        }
    } catch (error) {
        console.error('Error loading footer:', error);
    }
}
