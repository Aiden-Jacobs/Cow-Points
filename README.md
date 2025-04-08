### Cow Points: Web App README

---

#### **Overview**

Welcome to **Cow Points**, a fun and engaging game where the goal is to collect as many "Cow Points" as possible. The only way to earn a Cow Point is to spot a cow in the process of either sitting down or standing up while you’re driving in a car. This web app serves as your ultimate tool to track your points, see where others have spotted cows, and compete on the leaderboard.

The web app is currently in beta and publicly available at [cowpoints.com](https://cowpoints.com). We welcome feedback to improve your experience. Thanks for playing Cow Points!

---

#### **Features**

- ### 🗺️ Map of Sightings
  - **Your Points:** View and track the locations where you have earned Cow Points. (In progress)
  - **Community Map:** Explore sightings shared by other players.
- ### 🏆 Leaderboard
  - See a global ranking of players based on the number of Cow Points collected.
  - See where you stand among the collectors.
- ### 🖥️ User Dashboard
  - Track your personal Cow Points total.
  - Add new Cow Points as you see cows in action.
  - View stats about your sightings.
- **Responsive Design**: The web app works seamlessly on desktop and mobile devices.

---

#### **Tech Stack**

- **Frontend**: HTML, CSS, and JavaScript.
- **Backend**: Supabase (database) with the `supabase-js` library for interactions.
- **Hosting**: [cowpoints.com](https://cowpoints.com).

---

## File Structure
### Key HTML Files
- **`index.html`**: Main entry point featuring the leaderboard.
- **`map_leaderboard.html`**: Displays the map with player sightings.
- **`sign_in.html`**: User sign-in page.
- **`sign_up.html`**: User registration page.
- **`user_dashboard.html`**: Dashboard for managing Cow Points.

### Assets
- **Art**: Fun pixel cow-themed images in various formats (GIF, JPG, PNG, SVG).
- **Fonts**: Custom pixel art fonts for a retro gaming aesthetic.

### Source Code
- **`src/pages`**: Contains JavaScript files for handling app functionality.
- **`src/styles`**: CSS files for styling the app.
- **`src/utils`**: Utility functions for reusable code (e.g., random backgrounds, header buttons).
---

#### **Database Structure**

The backend uses the following table structure in Supabase:

- **Points Table**
  - Tracks individual cow sightings, including location, time, and user details.
  - Columns:
    - `id` (bigint): Primary key.
    - `lat` (double precision): Latitude of the sighting.
    - `lng` (double precision): Longitude of the sighting.
    - `date_and_time` (timestamp): Date and time of the sighting.
    - `description` (text): Optional description of the sighting.
    - `user` (bigint): User ID who logged the sighting.

- **Total Points Table**
  - Keeps track of total Cow Points collected by each user.
  - Columns:
    - `id` (bigint): Primary key.
    - `name` (text): Username of the player.
    - `num_points` (bigint): Total Cow Points collected.

- **Users Table**
  - Stores user account details.
  - Columns:
    - `id` (bigint): Primary key.
    - `username` (text): Username.
    - `UID` (uuid): Unique identifier for the user.

---

#### **How to Use**

1. **Sign Up or Sign In**:
   - Create an account or log in to start tracking your Cow Points.
2. **Record a Sighting**:
   - Add new Cow Points by logging the date, time, and location of your sighting.
3. **Explore the Map**:
   - View your sightings and discover sightings from other players.
4. **Climb the Leaderboard**:
   - Check out the leaderboard to see where you rank among other players.
5. **Give Feedback**:
   - Share your thoughts on how we can improve Cow Points!

---

#### **Development**

To run the project locally:
1. Clone this repository.
2. Install dependencies (if any).
3. Set up a Supabase project and configure the environment variables with your Supabase credentials.
4. Open the `index.html` file in your browser to test the app.

---

#### **Contributing**

We are looking for feedback and contributions to improve the Cow Points experience. If you’d like to contribute:
- Report bugs or suggest features via [GitHub Issues](https://github.com/Aiden-Jacobs/Cow-I-win/issues).
- Fork the repository, make changes, and create a pull request.


---

#### **Contact**

For feedback, suggestions, or questions, reach out to us at admin@cowpoints.com. Happy Cow Point hunting! 🐄🎉
