import { setRandomBackground, add_header_buttons } from '../utils/utils.js';

// Import Supabase
import "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
const { createClient } = supabase;

// Initialize Supabase
const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc';
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



async function loadStatusIssues() {
  const container = document.getElementById("status-feed");

  try {
    const res = await fetch(
      "https://api.github.com/repos/Aiden-Jacobs/Cow-Points/issues?labels=status"
    );

    const issues = await res.json();

    if (!Array.isArray(issues) || issues.length === 0) {
      container.innerHTML = "<p>No active status updates.</p>";
      return;
    }

    container.innerHTML = "";

    issues.forEach(issue => {
      const wrapper = document.createElement("div");
      wrapper.className = "status-card";

      const bodyHTML = marked.parse(issue.body || "No details provided.");

      wrapper.innerHTML = `
        <h3>${issue.title}</h3>

        <div class="status-meta">
          <span>#${issue.number}</span>
          <span>${new Date(issue.created_at).toLocaleString()}</span>
          <span class="state ${issue.state}">
            ${issue.state.toUpperCase()}
          </span>
        </div>

        <div class="status-body">
          ${bodyHTML}
        </div>
      `;

      container.appendChild(wrapper);
    });

  } catch (err) {
    container.innerHTML = "<p>Failed to load status updates.</p>";
    console.error(err);
  }
}

loadStatusIssues();



setRandomBackground();
add_header_buttons(_supabase);
loadStatusIssues();
