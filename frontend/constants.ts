import { AgentId, AgentConfig, Appointment, CallLog } from './types.ts';

export const AGENTS: AgentConfig[] = [
    {
        id: AgentId.BUSINESS,
        name: 'Business Manager',
        subtitle: 'Strategic Oversight & Operations',
        iconName: 'Briefcase',
        colorClass: 'bg-purple-500',
        defaultPrompt: 'You are a Business Manager agent. Your goal is to help optimize operations, review strategy, and assist with business planning. You have access to a bookAppointment tool. You MUST use this tool to actually schedule appointments when requested. Never confirm an appointment without successfully calling the tool. Be professional, analytical, and concise.'
    },
    {
        id: AgentId.SOCIAL,
        name: 'Social Media Agent',
        subtitle: 'Content & Engagement',
        iconName: 'Share2',
        colorClass: 'bg-pink-500',
        defaultPrompt: 'You are a Social Media agent. Create engaging, platform-appropriate content. When asked to create a post, provide the text and a description of an image that would accompany it.'
    },
    {
        id: AgentId.WEB,
        name: 'Web Design Agent',
        subtitle: 'Landing Page Builder',
        iconName: 'LayoutGrid',
        colorClass: 'bg-green-500',
        defaultPrompt: 'You are a Web Design agent. The user is viewing a landing page composed of specific HTML blocks with IDs (e.g., header-block, hero-block, features-block, pricing-block, booking-block, contact-block). When the user asks for a change, identify which block needs changing. You must return a JSON object containing the "blockId" and the "newHtml" for that specific block. Do NOT rewrite the entire page. Only return the modified block. If the user asks to remove or delete a section, return an empty string "" for "newHtml". \n\nIMAGE RULES:\n1. If the user provides an uploaded image URL (e.g., [Use image URL: UPLOADED_IMG_123]), you MUST use the EXACT string "UPLOADED_IMG_123" as the src attribute. Do NOT add file extensions (like .png or .jpg) to this string.\n2. If you need to generate a new placeholder image from the web, ALWAYS use the format "https://picsum.photos/{width}/{height}" (e.g., https://picsum.photos/200/60 for a logo, or https://picsum.photos/800/600 for a hero). Do NOT use an "x" between dimensions. Do NOT use Unsplash.\n3. If replacing a text logo with an image logo, ensure the <img> tag has appropriate Tailwind sizing classes (e.g., class="h-10 w-auto object-contain") so it is visible.\n\nFUNCTIONALITY RULES:\n4. DO NOT change the IDs of any forms, inputs, or interactive elements (e.g., lead-form, appt-form, time-slots, calendar-days). The site relies on these exact IDs to save data to the database.'
    },
    {
        id: AgentId.FRONT_DESK,
        name: 'Front Desk Agent',
        subtitle: 'Voice AI & Inquiries',
        iconName: 'Headset',
        colorClass: 'bg-orange-500',
        defaultPrompt: 'You are a Front Desk agent. You handle inquiries, review call logs, and help draft follow-ups or book appointments based on caller needs. You have access to a bookAppointment tool and a transferCall tool. You MUST use the bookAppointment tool to actually schedule appointments when requested. If a user asks to speak to a human, a specific department, or a staff member, you MUST use the transferCall tool to route them. Be polite and helpful.'
    }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
    { id: '1', clientName: 'Alice Smith', dateTime: '2023-11-15T10:00', service: 'Consultation', status: 'Scheduled' },
    { id: '2', clientName: 'Bob Jones', dateTime: '2023-11-16T14:30', service: 'Strategy Review', status: 'Scheduled' },
    { id: '3', clientName: 'Charlie Brown', dateTime: '2023-11-10T09:00', service: 'Initial Call', status: 'Completed' },
];

export const MOCK_CALL_LOGS: CallLog[] = [
    {
        id: 'call_1',
        callerName: 'David Wilson',
        phoneNumber: '+1 (555) 123-4567',
        duration: '04:23',
        timestamp: 'Today, 09:15 AM',
        transcript: "Caller: Hi, I'm interested in your premium package. AI: Hello! I'd be happy to help. What specific features are you looking for? Caller: Mostly the advanced analytics. AI: Great, our premium package includes full analytics access. Would you like to schedule a demo?",
        summary: 'Inquired about premium package analytics. Suggested scheduling a demo.'
    },
    {
        id: 'call_2',
        callerName: 'Eva Davis',
        phoneNumber: '+1 (555) 987-6543',
        duration: '02:10',
        timestamp: 'Yesterday, 02:30 PM',
        transcript: "Caller: I need to cancel my appointment for tomorrow. AI: I can help with that. Let me pull up your record. Okay, your appointment is cancelled. Would you like to reschedule? Caller: Not right now, thanks.",
        summary: 'Cancelled appointment for tomorrow. Did not reschedule.'
    }
];

export const INJECTED_SCRIPT = `
(function() {
    console.log("Kate AOS: Interactive script loaded successfully.");
    
    // 1. Dynamic Calendar Setup
    const setupCalendar = () => {
        const today = new Date();
        const monthDisplay = document.getElementById('calendar-month-display');
        if (monthDisplay) {
            monthDisplay.innerText = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }

        const daysContainer = document.getElementById('calendar-days');
        if (daysContainer) {
            daysContainer.innerHTML = '';
            const year = today.getFullYear();
            const month = today.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            // Empty slots for days before the 1st
            for(let i=0; i<firstDay; i++) {
                daysContainer.innerHTML += '<div class="p-2"></div>';
            }
            
            // Actual days
            const todayDateOnly = new Date(today.setHours(0,0,0,0));
            for(let i=1; i<=daysInMonth; i++) {
                const d = new Date(year, month, i);
                // Format YYYY-MM-DD safely
                const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                const isPast = d < todayDateOnly;
                
                if (isPast) {
                    daysContainer.innerHTML += '<div class="p-2 text-gray-300">' + i + '</div>';
                } else {
                    daysContainer.innerHTML += '<button type="button" class="p-2 rounded-full hover:bg-indigo-100 focus:bg-indigo-600 focus:text-white transition date-btn" data-date="' + dateStr + '">' + i + '</button>';
                }
            }
        }
    };
    
    setupCalendar();

    // 2. Event Delegation (Handles clicks even if AI replaces the HTML)
    let selectedDate = '';
    let selectedTime = '';

    document.addEventListener('click', (e) => {
        // Smooth Scrolling
        const anchor = e.target.closest('a[href^="#"]');
        if (anchor) {
            e.preventDefault();
            const targetId = anchor.getAttribute('href');
            if(targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80; 
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }
            return;
        }

        // Date Selection
        const dateBtn = e.target.closest('.date-btn');
        if (dateBtn) {
            document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('bg-indigo-600', 'text-white'));
            dateBtn.classList.add('bg-indigo-600', 'text-white');
            selectedDate = dateBtn.getAttribute('data-date');
            
            const dateObj = new Date(selectedDate + 'T12:00:00');
            const display = document.getElementById('selected-date-display');
            if(display) display.innerText = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            return;
        }

        // Time Selection
        const timeBtn = e.target.closest('.time-btn');
        if (timeBtn) {
            if(!selectedDate) { alert('Please select a date first'); return; }
            selectedTime = timeBtn.getAttribute('data-time');
            
            const timeSelection = document.getElementById('time-selection');
            const bookingForm = document.getElementById('booking-form');
            
            if(timeSelection && bookingForm) {
                timeSelection.classList.add('hidden');
                bookingForm.classList.remove('hidden');
            }
            
            const formattedTime = timeBtn.innerText;
            const dateObj = new Date(selectedDate + 'T12:00:00');
            const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            
            const summary = document.getElementById('booking-summary');
            if(summary) summary.innerText = formattedTime + ' on ' + formattedDate;
            
            const datetimeInput = document.getElementById('appt-datetime');
            if(datetimeInput) datetimeInput.value = selectedDate + 'T' + selectedTime;
            return;
        }

        // Back Button
        const backBtn = e.target.closest('#back-to-times');
        if (backBtn) {
            const timeSelection = document.getElementById('time-selection');
            const bookingForm = document.getElementById('booking-form');
            if(timeSelection && bookingForm) {
                bookingForm.classList.add('hidden');
                timeSelection.classList.remove('hidden');
            }
            return;
        }
    });

    // 3. Form Submissions
    document.addEventListener('submit', (e) => {
        const form = e.target;
        
        // Contact Form
        if (form.id === 'lead-form') {
            e.preventDefault();
            const btn = form.querySelector('button');
            const originalText = btn ? btn.innerText : 'Submit';
            if(btn) btn.innerText = 'Sending...';
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            window.parent.postMessage({ type: 'SUBMIT_CONTACT', payload: data }, '*');
            
            setTimeout(() => {
                if(btn) {
                    btn.innerText = 'Message Sent!';
                    btn.classList.replace('bg-indigo-600', 'bg-green-600');
                    btn.classList.replace('hover:bg-indigo-700', 'hover:bg-green-700');
                }
                form.reset();
                setTimeout(() => { 
                    if(btn) {
                        btn.innerText = originalText; 
                        btn.classList.replace('bg-green-600', 'bg-indigo-600');
                        btn.classList.replace('hover:bg-green-700', 'hover:bg-indigo-700');
                    }
                }, 3000);
            }, 800);
        }

        // Appointment Form
        if (form.id === 'appt-form') {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]') || form.querySelector('button');
            if(btn) btn.innerText = 'Booking...';
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            window.parent.postMessage({ 
                type: 'BOOK_APPOINTMENT', 
                payload: {
                    name: data.name,
                    email: data.email,
                    dateTime: data.dateTime,
                    service: 'Website Consultation'
                }
            }, '*');

            setTimeout(() => {
                const bookingFormContainer = document.getElementById('booking-form');
                if(bookingFormContainer) {
                    bookingFormContainer.innerHTML = '<div class="text-center py-8"><div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div><h3 class="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3><p class="text-gray-600">We have sent a calendar invitation to your email.</p></div>';
                }
            }, 1000);
        }
    });
})();
`;

export const DEFAULT_WEB_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Smooth scrolling for anchor links */
        html { 
            scroll-behavior: smooth; 
            scroll-padding-top: 80px; /* Prevents the sticky header from covering the section title */
        }
        
        /* Edit Mode Labels - Permanently shows the block ID so the user knows what to call it */
        [id$="-block"] { 
            position: relative; 
            outline: 2px dashed #cbd5e1; 
            outline-offset: -2px;
        }
        [id$="-block"]::before {
            content: "Section ID: " attr(id);
            position: absolute;
            top: 0;
            left: 0;
            background: #334155;
            color: white;
            font-size: 11px;
            font-family: monospace;
            font-weight: bold;
            padding: 4px 10px;
            border-bottom-right-radius: 8px;
            z-index: 40;
            pointer-events: none;
            opacity: 0.9;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        /* Adjust header label so it doesn't get hidden if sticky */
        #header-block::before {
            top: 100%;
            border-bottom-right-radius: 8px;
            border-top-right-radius: 0;
        }
    </style>
</head>
<body class="bg-white text-gray-800 font-sans antialiased">
    
    <!-- 1. Header Block -->
    <header id="header-block" class="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 class="text-2xl font-extrabold text-indigo-600 tracking-tight">Nexus<span class="text-gray-900">AI</span></h1>
            <nav class="hidden md:flex gap-6 font-medium text-sm">
                <a href="#hero-block" class="text-gray-600 hover:text-indigo-600 transition">Home</a>
                <a href="#features-block" class="text-gray-600 hover:text-indigo-600 transition">Features</a>
                <a href="#pricing-block" class="text-gray-600 hover:text-indigo-600 transition">Pricing</a>
                <a href="#booking-block" class="text-gray-600 hover:text-indigo-600 transition">Book Demo</a>
            </nav>
            <a href="#contact-block" class="bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700 transition shadow-md">Contact Us</a>
        </div>
    </header>

    <main>
        <!-- 2. Hero Block -->
        <section id="hero-block" class="text-center pt-32 pb-24 bg-gradient-to-b from-indigo-50 to-white">
            <div class="max-w-4xl mx-auto px-4">
                <span class="text-indigo-600 font-semibold tracking-wider uppercase text-sm mb-4 block">Next Generation Platform</span>
                <h2 class="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">Build faster with <br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">intelligent tools</span></h2>
                <p class="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">Automate your workflow, scale your business, and achieve more in less time with our industry-leading AI solutions.</p>
                <div class="flex justify-center gap-4">
                    <a href="#booking-block" class="bg-indigo-600 text-white px-8 py-4 rounded-full font-medium hover:bg-indigo-700 transition shadow-lg text-lg">Book a Demo</a>
                    <a href="#features-block" class="bg-white text-gray-800 border border-gray-200 px-8 py-4 rounded-full font-medium hover:bg-gray-50 transition shadow-sm text-lg">Learn More</a>
                </div>
            </div>
        </section>

        <!-- 3. Features Block -->
        <section id="features-block" class="max-w-6xl mx-auto px-4 py-24">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything you need to succeed</h2>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">Powerful features designed to help your team collaborate, build, and ship products faster than ever before.</p>
            </div>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div class="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">Lightning Fast</h3>
                    <p class="text-gray-600 leading-relaxed">Optimized performance out of the box for the best user experience. No configuration required.</p>
                </div>
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div class="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">Highly Secure</h3>
                    <p class="text-gray-600 leading-relaxed">Enterprise-grade security protocols to keep your data safe, encrypted, and compliant.</p>
                </div>
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div class="w-14 h-14 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center mb-6">
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">Infinitely Scalable</h3>
                    <p class="text-gray-600 leading-relaxed">Architecture that grows seamlessly alongside your business, from startup to enterprise.</p>
                </div>
            </div>
        </section>

        <!-- 4. Pricing Block -->
        <section id="pricing-block" class="py-24 bg-gray-50">
            <div class="max-w-6xl mx-auto px-4">
                <div class="text-center mb-16">
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
                    <p class="text-lg text-gray-600">No hidden fees. Cancel anytime.</p>
                </div>
                <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <!-- Basic -->
                    <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                        <h3 class="text-xl font-bold text-gray-900 mb-2">Starter</h3>
                        <p class="text-gray-500 mb-6">Perfect for small projects</p>
                        <div class="mb-6"><span class="text-4xl font-extrabold text-gray-900">$29</span><span class="text-gray-500">/mo</span></div>
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-center gap-2 text-gray-600"><svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Up to 5 users</li>
                            <li class="flex items-center gap-2 text-gray-600"><svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Basic analytics</li>
                        </ul>
                        <button class="w-full py-3 rounded-lg font-medium border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition">Choose Starter</button>
                    </div>
                    <!-- Pro -->
                    <div class="bg-indigo-600 p-8 rounded-2xl shadow-xl border border-indigo-700 transform md:-translate-y-4 relative">
                        <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">Most Popular</div>
                        <h3 class="text-xl font-bold text-white mb-2">Professional</h3>
                        <p class="text-indigo-200 mb-6">For growing teams</p>
                        <div class="mb-6"><span class="text-4xl font-extrabold text-white">$99</span><span class="text-indigo-200">/mo</span></div>
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-center gap-2 text-white"><svg class="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Unlimited users</li>
                            <li class="flex items-center gap-2 text-white"><svg class="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Advanced analytics</li>
                            <li class="flex items-center gap-2 text-white"><svg class="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Priority support</li>
                        </ul>
                        <button class="w-full py-3 rounded-lg font-bold bg-white text-indigo-600 hover:bg-gray-50 transition shadow-md">Choose Pro</button>
                    </div>
                    <!-- Enterprise -->
                    <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                        <h3 class="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
                        <p class="text-gray-500 mb-6">For large organizations</p>
                        <div class="mb-6"><span class="text-4xl font-extrabold text-gray-900">Custom</span></div>
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-center gap-2 text-gray-600"><svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Everything in Pro</li>
                            <li class="flex items-center gap-2 text-gray-600"><svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Dedicated account manager</li>
                        </ul>
                        <button class="w-full py-3 rounded-lg font-medium border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition">Contact Sales</button>
                    </div>
                </div>
            </div>
        </section>

        <!-- 5. Booking Calendar Block (Calendly Style) -->
        <section id="booking-block" class="py-24 bg-white">
            <div class="max-w-4xl mx-auto px-4">
                <div class="text-center mb-12">
                    <h2 class="text-3xl font-bold text-gray-900">Book a Consultation</h2>
                    <p class="text-gray-600 mt-2">Select a date and time that works for you.</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row">
                    <!-- Left: Calendar -->
                    <div class="md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
                        <h3 class="font-bold text-lg mb-6 flex justify-between items-center">
                            <button type="button" class="p-1 hover:bg-gray-200 rounded">&lt;</button>
                            <span id="calendar-month-display">Loading...</span>
                            <button type="button" class="p-1 hover:bg-gray-200 rounded">&gt;</button>
                        </h3>
                        <div class="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-500 mb-2">
                            <div>SU</div><div>MO</div><div>TU</div><div>WE</div><div>TH</div><div>FR</div><div>SA</div>
                        </div>
                        <div class="grid grid-cols-7 gap-2 text-center text-sm" id="calendar-days">
                            <!-- Populated dynamically by JS -->
                        </div>
                    </div>
                    <!-- Right: Times & Form -->
                    <div class="md:w-1/2 p-8">
                        <div id="time-selection">
                            <h3 class="font-bold text-lg mb-6" id="selected-date-display">Select a Date</h3>
                            <div class="space-y-3 max-h-64 overflow-y-auto pr-2" id="time-slots">
                                <button type="button" class="w-full py-3 px-4 border border-indigo-200 text-indigo-700 font-medium rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition time-btn" data-time="09:00">09:00 AM</button>
                                <button type="button" class="w-full py-3 px-4 border border-indigo-200 text-indigo-700 font-medium rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition time-btn" data-time="10:00">10:00 AM</button>
                                <button type="button" class="w-full py-3 px-4 border border-indigo-200 text-indigo-700 font-medium rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition time-btn" data-time="11:30">11:30 AM</button>
                                <button type="button" class="w-full py-3 px-4 border border-indigo-200 text-indigo-700 font-medium rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition time-btn" data-time="14:00">02:00 PM</button>
                                <button type="button" class="w-full py-3 px-4 border border-indigo-200 text-indigo-700 font-medium rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition time-btn" data-time="15:30">03:30 PM</button>
                            </div>
                        </div>
                        <div id="booking-form" class="hidden">
                            <h3 class="font-bold text-lg mb-2">Confirm Booking</h3>
                            <p class="text-sm text-gray-600 mb-6" id="booking-summary"></p>
                            <form id="appt-form">
                                <input type="hidden" name="dateTime" id="appt-datetime">
                                <div class="mb-4">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input type="text" name="name" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                                </div>
                                <div class="mb-6">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" name="email" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                                </div>
                                <div class="flex gap-3">
                                    <button type="button" id="back-to-times" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Back</button>
                                    <button type="submit" class="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition">Confirm</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 6. Contact Form Block -->
        <section id="contact-block" class="py-24 bg-gray-900 text-white">
            <div class="max-w-4xl mx-auto px-4 text-center">
                <h2 class="text-3xl md:text-4xl font-bold mb-6">Get in Touch</h2>
                <p class="text-xl text-gray-400 mb-10">Have a question or want to learn more? Send us a message.</p>
                <form id="lead-form" class="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-2xl text-left">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input type="text" name="name" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900" placeholder="Jane Doe" />
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input type="email" name="email" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900" placeholder="you@company.com" />
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input type="tel" name="phone" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900" placeholder="(555) 123-4567" />
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea name="message" required rows="4" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900" placeholder="How can we help you?"></textarea>
                    </div>
                    <button type="submit" class="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">Send Message</button>
                </form>
            </div>
        </section>
    </main>

    <!-- 7. Footer Block -->
    <footer id="footer-block" class="bg-gray-950 text-gray-400 py-12">
        <div class="max-w-6xl mx-auto px-4 text-sm text-center flex flex-col md:flex-row justify-between items-center">
            <p>&copy; 2024 NexusAI Inc. All rights reserved.</p>
            <div class="flex gap-4 mt-4 md:mt-0">
                <a href="#" class="hover:text-white transition">Privacy Policy</a>
                <a href="#" class="hover:text-white transition">Terms of Service</a>
            </div>
        </div>
    </footer>
</body>
</html>`;
