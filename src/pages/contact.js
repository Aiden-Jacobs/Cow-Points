import { setRandomBackground, add_header_buttons } from '../utils/utils.js';

// Import Singleton Supabase Client
import { supabase as _supabase } from '../utils/supabaseClient.js';

// Select the contact form
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // prevent default form submission

    // Get form values
    const name = contactForm.name.value.trim();
    const email = contactForm.email.value.trim();
    const subject = contactForm.subject.value.trim();
    const message = contactForm.message.value.trim();

    if (!name || !email || !subject || !message) {
      alert('Please fill out all fields.');
      return;
    }

    // Insert into Supabase
    // const { data, error } = await _supabase
    //   .from('contact_messages')
    //   .insert([
    //     { name, email, subject, message }
    //   ]);

    // if (error) {
    //   console.error('Error submitting message:', error);
    //   alert('There was an error sending your message. Please try again later.');
    //   return;
    // }

    // Success
    // alert('Message sent successfully! Thank you.');
    // contactForm.reset();

    // alert for feedback submission form is not currently functional
    alert('Feedback submission is currently disabled.\nPlease contact us via email at admin@cowpoints.com ');
  });
}

setRandomBackground();
add_header_buttons(_supabase);