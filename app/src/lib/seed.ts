import { DEFAULT_ROLE_FEATURES, type Lesson, type Product, type Settings } from './types'

// Starter catalogue. Edit freely (Admin → Products, or the products table in Supabase).
type SeedProduct = Omit<Product, 'id' | 'active' | 'sort_order' | 'requires_partner_kit' | 'banner_gradient'> &
  Partial<Pick<Product, 'banner_gradient'>>

const P: SeedProduct[] = [
  // ---------- Pre-School ----------
  {
    slug: 'smart-memory-kit', mode: 'pre_school', title: 'Smart Memory Kit', subtitle: 'Flashcards + screen-free smart learning',
    emoji: '🧠', price: 549, billing: 'monthly', duration: 'Monthly box', commission_pct: 20, best_for: 'Parents + kids (Pre-school to Class 8)',
    description: 'A monthly box of picture flashcards and memory games that builds recall, focus and vocabulary in 10 minutes a day — no screens needed.',
    features: ['60+ themed flashcards every month', '10-minute daily activity guide for parents', 'Progress chart & stickers', 'Free home delivery'],
    pitch: 'Hi! 👋 Ye kit bachchon ko bina screen ke fast learning mein help karta hai — sirf 10 minute roz, aur 2–3 hafte mein farak dikhta hai. Main aapko demo video bhej deta/deti hoon, pasand aaye toh “OK” bol dijiye.',
    is_physical: true, is_featured: true, banner_gradient: 'from-navy-900 via-navy-700 to-indigo-700',
  },
  {
    slug: 'phonics-starter-kit', mode: 'pre_school', title: 'Phonics Starter Kit', subtitle: 'Sounds, letters & first words',
    emoji: '🔤', price: 399, billing: 'monthly', duration: 'Monthly box', commission_pct: 20, best_for: 'Kids aged 3–6',
    description: 'Letter-sound cards, tracing sheets and story cards that take a child from sounds to reading first words.',
    features: ['Letter-sound cards', 'Reusable tracing sheets', '4 mini story books / month', 'Parent guide in Hindi & English'],
    pitch: 'Aapka bachcha A-B-C toh bolta hai, par padhna shuru kiya? Ye phonics kit ghar par hi reading start karwa deta hai. Demo dekhna chahenge?',
    is_physical: true, is_featured: false, banner_gradient: 'from-emerald-800 via-teal-700 to-cyan-700',
  },
  {
    slug: 'little-genius-activity-box', mode: 'pre_school', title: 'Little Genius Activity Box', subtitle: 'STEM + art activities every month',
    emoji: '🧩', price: 699, billing: 'monthly', duration: 'Monthly box', commission_pct: 18, best_for: 'Kids aged 4–10',
    description: 'Hands-on science, maths and craft projects that keep kids busy and learning on weekends.',
    features: ['4 projects per box', 'All materials included', 'Video instructions via QR', 'Free home delivery'],
    pitch: 'Weekend par bachche phone mein lage rehte hain? Is box mein har mahine 4 mazedaar science + craft projects aate hain. Photo bhejun?',
    is_physical: true, is_featured: true, banner_gradient: 'from-fuchsia-800 via-purple-700 to-indigo-700',
  },
  // ---------- Pro-School ----------
  {
    slug: 'accounting-tax-business-combo', mode: 'pro_school', title: 'Accounting Technician + Tax Practitioner + Business Accounting',
    subtitle: 'Complete job-ready commerce program', emoji: '📚', price: 59999, billing: 'one_time', duration: '12 Months', commission_pct: 8,
    best_for: 'Commerce graduates & 12th pass students', description: 'A full-year program covering bookkeeping, GST & income-tax practice and business accounting with live projects.',
    features: ['Live + recorded classes', 'Practical on Tally & Excel', 'Internship support', 'Certificate on completion'],
    pitch: 'Commerce ke baad job ya apni practice — dono ke liye ye 12-month program hai: accounting, GST, income tax sab practical. Brochure bhejun?',
    is_physical: false, is_featured: true, banner_gradient: 'from-orange-700 via-amber-600 to-yellow-600',
  },
  {
    slug: 'advanced-accounting-taxation', mode: 'pro_school', title: 'Certificate in Advanced Accounting & Taxation',
    subtitle: 'Hands-on accounts & tax filing', emoji: '📘', price: 39999, billing: 'one_time', duration: '6 Months', commission_pct: 8,
    best_for: 'B.Com students & working accountants', description: 'Advanced accounting, TDS, GST returns and ITR filing with real case studies.',
    features: ['GST & ITR filing practice', 'Weekend batches', 'Placement assistance', 'Certificate'],
    pitch: '6 mahine mein accounts aur tax filing ka poora practical — weekend batches bhi hain, job ke saath kar sakte ho. Details bhejun?',
    is_physical: false, is_featured: false,
  },
  {
    slug: 'professional-accounting', mode: 'pro_school', title: 'Certificate in Professional Accounting',
    subtitle: 'Industry-standard accounting skills', emoji: '📗', price: 30000, billing: 'one_time', duration: '5 Months', commission_pct: 8,
    best_for: 'Freshers who want an accounts job', description: 'Financial statements, payroll, reconciliation and MIS reporting for office roles.',
    features: ['Excel for accountants', 'Payroll & compliance', 'Mock interviews', 'Certificate'],
    pitch: 'Accounts job ke liye jo skills companies maangti hain, wahi 5 mahine mein — Excel, payroll, reporting. Interested?',
    is_physical: false, is_featured: false,
  },
  {
    slug: 'tally-prime-gst', mode: 'pro_school', title: 'Tally Prime with GST', subtitle: 'Fast-track Tally course',
    emoji: '🧾', price: 7999, billing: 'one_time', duration: '2 Months', commission_pct: 12, best_for: 'Students, shop owners, job seekers',
    description: 'Learn Tally Prime from vouchers to GST returns in 8 weeks.',
    features: ['Vouchers to GST returns', 'Practice company data', 'Doubt sessions', 'Certificate'],
    pitch: 'Sirf 2 mahine mein Tally Prime + GST — job ya apni dukaan ke accounts ke liye perfect. Fees bhi kam hai. Batch details bhejun?',
    is_physical: false, is_featured: true, banner_gradient: 'from-sky-800 via-blue-700 to-indigo-700',
  },
  {
    slug: 'income-tax-practitioner', mode: 'pro_school', title: 'Income Tax Practitioner', subtitle: 'Start your own ITR practice',
    emoji: '🧮', price: 12999, billing: 'one_time', duration: '3 Months', commission_pct: 10, best_for: 'Anyone who wants a tax-filing side business',
    description: 'File ITRs for clients: all ITR forms, notices, TDS and client handling.',
    features: ['All ITR forms', 'Handling notices', 'Client acquisition tips', 'Certificate'],
    pitch: 'Har saal July mein ITR ki demand hoti hai — ye course karke aap apni tax practice shuru kar sakte ho. Details?',
    is_physical: false, is_featured: false,
  },
  {
    slug: 'gst-practitioner', mode: 'pro_school', title: 'GST Practitioner', subtitle: 'GST registration, returns & compliance',
    emoji: '📊', price: 9999, billing: 'one_time', duration: '1.5 Months', commission_pct: 10, best_for: 'Accountants & small business owners',
    description: 'Registration, GSTR-1/3B/9, e-way bills and reconciliation, hands-on.',
    features: ['Live GST portal practice', 'E-way bill & e-invoice', 'Reconciliation', 'Certificate'],
    pitch: 'GST ka kaam har business ko chahiye. 6 hafte ka ye course karke aap returns file karna seekh jaoge. Brochure bhejun?',
    is_physical: false, is_featured: false,
  },
  // ---------- School ----------
  {
    slug: 'national-competition', mode: 'school', title: 'Leaders National Competition', subtitle: 'Poetry • Story • Essay • Debate',
    emoji: '🏆', price: 299, billing: 'one_time', duration: 'Season 2026–27', commission_pct: 15, best_for: 'Students Class 1–12',
    description: 'A national-level writing and speaking competition with certificates for every participant and prizes for winners.',
    features: ['Certificate for all', 'National ranking', 'Winners published in anthology', 'Online participation'],
    pitch: 'National level competition — poetry, story, essay, debate. Har participant ko certificate milta hai. Aapke bachche ka naam register karun?',
    is_physical: false, is_featured: true, banner_gradient: 'from-amber-700 via-yellow-600 to-orange-600',
  },
  {
    slug: 'young-author-program', mode: 'school', title: 'Young Author Program', subtitle: 'Get your child’s book published',
    emoji: '✍️', price: 1999, billing: 'one_time', duration: '8 Weeks', commission_pct: 15, best_for: 'Students who love writing',
    description: 'Guided writing sessions ending with the child’s own published book (print + e-book).',
    features: ['Weekly mentor sessions', 'Professional editing', 'Printed author copy', 'Launch certificate'],
    pitch: 'Aapka bachcha khud ki book publish kar sakta hai! 8 hafte ka guided program — end mein printed book milti hai. Sample dikhaun?',
    is_physical: false, is_featured: false,
  },
  {
    slug: 'school-skill-workshop', mode: 'school', title: 'Skill Workshops for Schools', subtitle: 'Communication, finance & leadership',
    emoji: '🎤', price: 4999, billing: 'one_time', duration: '1-day workshop', commission_pct: 10, best_for: 'School principals & coordinators',
    description: 'On-campus workshops on public speaking, money basics and leadership for a full class.',
    features: ['Up to 60 students', 'Certified trainer', 'Activity kits included', 'Certificates for all'],
    pitch: 'Sir/Ma’am, hum schools mein 1-day skill workshop karwate hain — public speaking, money basics, leadership. Ek proposal bhejun?',
    is_physical: false, is_featured: false,
  },
  {
    slug: 'learning-resource-pack', mode: 'school', title: 'Learning Resource Pack', subtitle: 'Worksheets & practice papers',
    emoji: '📦', price: 499, billing: 'one_time', duration: 'Full year', commission_pct: 15, best_for: 'Students Class 1–10',
    description: 'Printable worksheets, practice papers and revision notes for the full academic year.',
    features: ['Class-wise worksheets', 'Practice papers', 'Answer keys', 'Instant download'],
    pitch: 'Poore saal ki worksheets aur practice papers sirf ₹499 mein — exam ki tayyari easy. Link bhejun?',
    is_physical: false, is_featured: false,
  },
]

export const SEED_PRODUCTS: Product[] = P.map((p, i) => ({
  ...p,
  id: `prod-${p.slug}`,
  active: true,
  sort_order: i,
  requires_partner_kit: p.mode === 'pre_school',
  banner_gradient: p.banner_gradient ?? null,
}))

export const SEED_LESSONS: Omit<Lesson, 'id'>[] = [
  { product_id: null, category: 'how_to_sell', level: 'beginner', sort_order: 1, title: 'The Best Flow: Pitch → Demo → Follow-up → Close',
    body: '1. Pitch: send the copy-paste pitch to 10 warm contacts a day.\n2. Demo: share the product video or brochure only to people who reply.\n3. Follow-up: message again after 24 hours, then after 3 days.\n4. Close: send your partner link and help them complete payment.' },
  { product_id: null, category: 'how_to_sell', level: 'beginner', sort_order: 2, title: 'Where to find your first 5 customers',
    body: 'Start with people who already trust you: family groups, society/parent groups, college friends, office colleagues. Post once in a group, then follow up 1-on-1 — personal messages convert 5× better than group posts.' },
  { product_id: null, category: 'branding', level: 'intermediate', sort_order: 3, title: 'Personal branding on WhatsApp Status',
    body: 'Post one useful tip a day (study hack, tax deadline, parenting tip) and one product post every 3 days. Share real results and screenshots of happy customers (with permission). Consistency builds trust.' },
  { product_id: null, category: 'branding', level: 'intermediate', sort_order: 4, title: 'Instagram basics for partners',
    body: 'Use a clear profile photo and bio: “Education partner | Helping parents & students grow”. Post Reels of product unboxing or course highlights. Put your partner link in bio.' },
  { product_id: null, category: 'about', level: 'beginner', sort_order: 5, title: 'How your commission works',
    body: 'Every product shows its exact commission %. When a buyer pays through your link, commission is credited to your wallet automatically. If an order is cancelled or refunded, that commission is reversed. You earn only from sales — never from recruiting people.' },
]

export const DEFAULT_SETTINGS: Settings = {
  min_withdrawal: 500,
  payout_days: 'Every Monday, within 7 working days of request',
  require_partner_kit: false,
  partner_kit_price: 999,
  support_phone: '',
  support_email: '',
  whatsapp_number: '',
  role_features: DEFAULT_ROLE_FEATURES,
}
