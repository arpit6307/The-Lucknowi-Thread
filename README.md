Chikankari: The Art of Lucknow - React Portfolio
Yeh ek modern aur poori tarah se responsive portfolio website hai jo Lucknow ki khoobsurat Chikankari kala ko pradarshit karti hai. Is project ko shuruaat mein HTML, CSS, aur JavaScript se banaya gaya tha aur ab ise React.js, Vite, aur React Bootstrap ka istemaal karke poori tarah se modern tech stack par dubara banaya gaya hai.

✨ Features
Is website mein kai modern features shaamil hain:

Poori Tarah se Responsive Design: Desktop, tablet, aur mobile par aasaani se chalti hai.

Multi-Page Layout: react-router-dom ka istemaal karke Home aur Creations page ke beech aasaan navigation.

Interactive Sliders: Homepage aur Creations page par gallery ke liye custom slider.

Contact Form: EmailJS ke saath integrate kiya gaya contact form jo seedhe aapke email par message bhejta hai.

Festive Announcement Banner: Navratri jaise tyohaaron ke liye ek special banner jismein "Coming Soon" modal aur countdown timer hai.

Toast Notifications: Form submit karne par 5 second ke liye khoobsurat success ya error messages.

Custom Cursor: Desktop view ke liye ek modern aur interactive cursor.

Scroll-to-Top Button: Lambe pages par aasaani se upar jaane ke liye ek floating button.

Modals: Privacy Policy aur Terms of Service ke liye Bootstrap modals.

Animations: AOS library ka istemaal karke scroll par aane waale khoobsurat animations.

🛠️ Tech Stack
Is project ko banane ke liye neeche di gayi technologies ka istemaal kiya gaya hai:

Frontend: React.js

Build Tool: Vite

Styling: React Bootstrap & Custom CSS

Routing: React Router DOM

Email Service: EmailJS

Animations: Animate on Scroll (AOS)

🚀 Getting Started
Is project ko apne local machine par chalaane ke liye neeche diye gaye steps follow karein:

Prerequisites
Aapke system mein Node.js aur npm install hona zaroori hai.

Installation
Project ko Clone karein:

git clone [https://github.com/your-username/chikankari-portfolio.git](https://github.com/your-username/chikankari-portfolio.git)

Project Directory mein Jaayein:

cd chikankari-portfolio

Dependencies Install karein:

npm install

EmailJS Credentials Set karein:

src/components/Contact.jsx file ko kholein.

Neeche di gayi lines mein apni khud ki EmailJS IDs daalein:

const SERVICE_ID = "YOUR_SERVICE_ID";
const TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const USER_ID = "YOUR_PUBLIC_KEY"; // Also known as Public Key

Development Server Chalaayein:

npm run dev

Ab browser mein http://localhost:5173/ kholein aur aapki website live hogi.

📁 File Structure
Project ka structure neeche diya gaya hai:

/
├── public/
├── src/
│   ├── assets/
│   │   └── styles.css        # Saari custom styling
│   ├── components/           # Saare reusable React components
│   │   ├── About.jsx
│   │   ├── AnnouncementBanner.jsx
│   │   ├── Contact.jsx
│   │   ├── CustomCursor.jsx
│   │   ├── Footer.jsx
│   │   ├── Gallery.jsx
│   │   ├── galleryData.js
│   │   ├── Hero.jsx
│   │   ├── History.jsx
│   │   ├── MosaicGallery.jsx
│   │   ├── Navbar.jsx
│   │   └── ScrollToTopButton.jsx
│   ├── pages/                # Page components
│   │   ├── Home.jsx
│   │   └── Creations.jsx
│   ├── App.jsx               # Main application layout aur routing
│   └── main.jsx              # Application ka entry point
├── .gitignore
├── index.html
├── package.json
└── README.md

📦 Deployment
Jab aap website ko live deploy karne ke liye taiyaar hon, toh neeche di gayi command chalaayein:

npm run build

Yeh command ek dist folder bana degi jise aap kisi bhi static hosting service jaise Netlify, Vercel, ya GitHub Pages par deploy kar sakte hain.

👥 Authors
Arpit Singh Yadav

Rituraj Srivastav

📜 License
Yeh project Apache License 2.0 ke antargat licensed hai.