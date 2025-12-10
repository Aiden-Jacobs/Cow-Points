import { setRandomBackground, add_header_buttons } from '../utils/utils.js';

// Import Supabase
import "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
const { createClient } = supabase;

// Initialize Supabase
const SUPABASE_URL = 'https://sagwqkyampwcuzvllbvm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3dxa3lhbXB3Y3V6dmxsYnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNjI5ODAsImV4cCI6MjA0ODgzODk4MH0.K42LmF79J3ZjKhiCkJd7p-Mc7cbj6sySd9hnNT0Aoxc';
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// // Select the contact form
// const contactForm = document.querySelector('.contact-form');

// if (contactForm) {
//   contactForm.addEventListener('submit', async (e) => {
//     e.preventDefault(); // prevent default form submission

//     // Get form values
//     const name = contactForm.name.value.trim();
//     const email = contactForm.email.value.trim();
//     const subject = contactForm.subject.value.trim();
//     const message = contactForm.message.value.trim();

//     if (!name || !email || !subject || !message) {
//       alert('Please fill out all fields.');
//       return;
//     }

//     // Insert into Supabase
//     const { data, error } = await _supabase
//       .from('contact_messages')
//       .insert([
//         { name, email, subject, message }
//       ]);

//     if (error) {
//       console.error('Error submitting message:', error);
//       alert('There was an error sending your message. Please try again later.');
//       return;
//     }

//     // Success
//     alert('Message sent successfully! Thank you.');
//     contactForm.reset();
//   });

    setRandomBackground();
    add_header_buttons(_supabase);

// }
