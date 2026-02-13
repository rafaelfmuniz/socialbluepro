"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/ui/BackToTop";
import { Mail, Phone, Clock, Send, Loader2, X, CheckCircle } from "lucide-react";
import { submitContactForm } from "@/actions/contact";
import { useToast } from "@/lib/toast";
import { getRecaptchaConfig, type RecaptchaConfig } from "@/actions/settings";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { validateEmailClient } from "@/lib/client-validation";
import ReCAPTCHA from "react-google-recaptcha";
import { Turnstile } from "@marsidev/react-turnstile";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const QuoteModal = dynamic(
  () => import('@/components/ui/QuoteModal'),
  { ssr: false }
);

export default function ContactPageClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  // Validation states
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [emailValue, setEmailValue] = useState("");
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const [captchaConfig, setCaptchaConfig] = useState<RecaptchaConfig | null>(null);

  const [emailValidationTimeout, setEmailValidationTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fetch captcha config on mount
    getRecaptchaConfig().then(config => {
      setCaptchaConfig(config);
    });
  }, []);

  const validatePhone = (phone: string): boolean => {
    try {
      const phoneNumber = parsePhoneNumberFromString(phone, 'US');

      if (!phoneNumber || !phoneNumber.isValid()) {
        setPhoneValid(false);
        setPhoneError("Invalid phone number.");
        return false;
      }

      const nationalNumber = phoneNumber.nationalNumber;
      const areaCode = nationalNumber.substring(0, 3);

      // Reject toll-free
      const tollFreeAreaCodes = ['800', '888', '877', '866', '855', '844', '833', '822'];
      if (tollFreeAreaCodes.includes(areaCode)) {
        setPhoneValid(false);
        setPhoneError("Invalid phone number.");
        return false;
      }

      // Reject test numbers
      if (areaCode === '555') {
        setPhoneValid(false);
        setPhoneError("Invalid phone number.");
        return false;
      }

      // Validate area code
      const validAreaCodes = [
        '201', '202', '203', '205', '206', '207', '208', '209', '210', '212', '213', '214', '215', '216', '217', '218', '219', '220', '223', '224', '225', '228', '229', '231', '234', '239', '240', '248', '251', '252', '253', '254', '256', '260', '262', '267', '269', '270', '272', '274', '276', '279', '281', '283', '301', '302', '303', '304', '305', '307', '308', '309', '310', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '323', '325', '327', '330', '331', '332', '334', '336', '337', '339', '341', '346', '347', '350', '351', '352', '360', '361', '364', '380', '385', '386', '401', '402', '404', '405', '406', '407', '408', '409', '410', '412', '413', '414', '415', '417', '419', '423', '424', '425', '430', '432', '434', '435', '440', '442', '443', '445', '447', '458', '463', '464', '469', '470', '475', '478', '479', '480', '484', '501', '502', '503', '504', '505', '507', '508', '509', '510', '512', '513', '515', '516', '517', '518', '520', '521', '522', '523', '524', '525', '526', '527', '528', '529', '530', '531', '534', '539', '540', '541', '551', '557', '559', '561', '562', '563', '564', '567', '570', '571', '572', '573', '574', '575', '577', '579', '580', '582', '585', '586', '588', '601', '602', '603', '605', '606', '607', '608', '609', '610', '612', '614', '615', '616', '617', '618', '619', '620', '623', '626', '628', '629', '630', '631', '636', '640', '641', '646', '650', '651', '656', '657', '659', '660', '661', '662', '667', '669', '670', '671', '672', '678', '679', '680', '681', '682', '684', '689', '701', '702', '703', '704', '706', '707', '708', '710', '712', '713', '714', '715', '716', '717', '718', '719', '720', '721', '724', '725', '726', '727', '731', '732', '734', '737', '740', '743', '747', '754', '757', '760', '762', '763', '765', '769', '770', '772', '773', '774', '775', '779', '781', '785', '786', '787', '801', '802', '803', '804', '805', '806', '808', '810', '812', '813', '814', '815', '816', '817', '818', '820', '826', '828', '830', '831', '832', '833', '834', '835', '838', '839', '840', '843', '845', '847', '848', '850', '854', '856', '857', '858', '859', '860', '862', '863', '864', '865', '868', '870', '872', '878', '901', '903', '904', '906', '907', '908', '909', '910', '912', '913', '914', '915', '916', '917', '918', '919', '920', '925', '928', '929', '930', '931', '934', '936', '937', '938', '940', '941', '945', '947', '949', '951', '952', '954', '956', '959', '970', '971', '972', '973', '975', '978', '979', '980', '984', '985', '989'
      ];

      if (!validAreaCodes.includes(areaCode)) {
        setPhoneValid(false);
        setPhoneError("Invalid phone number.");
        return false;
      }

      const formatted = phoneNumber.formatNational();
      setPhoneValue(formatted);
      setPhoneValid(true);
      setPhoneError(null);
      return true;
    } catch {
      setPhoneValid(false);
      setPhoneError("Invalid phone number.");
      return false;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneValue(value);

    if (value.trim().length === 0) {
      setPhoneValid(null);
      setPhoneError(null);
      return;
    }

    validatePhone(value);
  };

  const validateEmail = (email: string): boolean => {
    const validation = validateEmailClient(email);
    if (!validation.valid) {
      setEmailValid(false);
      setEmailError(validation.error || "Invalid email address.");
      return false;
    }
    setEmailValid(true);
    setEmailError(null);
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmailValue(value);

    if (emailValidationTimeout) {
      clearTimeout(emailValidationTimeout);
    }

    const timeout = setTimeout(() => {
      if (value.trim()) {
        validateEmail(value);
      }
    }, 500);

    setEmailValidationTimeout(timeout);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
    if (token) {
      setRecaptchaError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setRecaptchaError(null);

    // Validate reCAPTCHA if enabled
    if (captchaConfig?.is_enabled && !recaptchaToken) {
      setRecaptchaError("Please complete the security check.");
      setIsSubmitting(false);
      return;
    }

    let validationError = "";

    // Name validation
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      validationError = "Please enter your full name (at least 2 characters).";
    }

    // Email validation
    if (!validationError) {
      if (!emailValid && emailValue) {
        validationError = emailError || "Valid email address required.";
      } else if (!emailValue) {
        validationError = "Email is required.";
      } else if (!validateEmail(emailValue)) {
        validationError = emailError || "Valid email address required.";
      }
    }

    // Phone validation
    if (!validationError) {
      if (!phoneValid && phoneValue) {
        validationError = phoneError || "Valid US phone number required.";
      } else if (!phoneValue) {
        validationError = "Phone number is required.";
      } else if (!validatePhone(phoneValue)) {
        validationError = phoneError || "Valid US phone number required.";
      }
    }

    // Message validation
    if (!validationError && !formData.message.trim()) {
      validationError = "Please enter a message.";
    }

    if (validationError) {
      addToast(validationError, "error");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await submitContactForm({
        name: formData.name.trim(),
        email: emailValue.trim().toLowerCase(),
        phone: phoneValid ? (phoneValue.startsWith('+') ? phoneValue : '+1' + phoneValue.replace(/\D/g, '')) : "",
        message: formData.message.trim(),
        recaptchaToken: recaptchaToken || undefined
      });

      if (result.success) {
        addToast(result.message || "Message sent successfully!", "success");
        setFormData({ name: "", email: "", phone: "", message: "" });
        setPhoneValue("");
        setEmailValue("");
        setPhoneValid(null);
        setEmailValid(null);
        setRecaptchaToken(null);
      } else {
        addToast(result.error || "Failed to send message.", "error");
      }
    } catch (error) {
      addToast("An unexpected error occurred.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full relative bg-slate-50">
      <Navbar onGetQuote={() => setIsModalOpen(true)} />

      <section className="pt-32 pb-12 bg-slate-900">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">
            Get in <span className="text-accent italic">Touch.</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto font-medium">
            Have questions about a project or want to learn more about our services? We're here to help.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12">

            {/* Contact Info */}
            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Contact Information</h2>
                <div className="space-y-6">
                  <a href="tel:7207374607" className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                      <Phone size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Phone</span>
                      <span className="text-lg font-bold text-slate-900">(720) 737-4607</span>
                    </div>
                  </a>
                  <a href="mailto:contact@socialbluepro.com" className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                      <Mail size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Email</span>
                      <span className="text-lg font-bold text-slate-900">contact@socialbluepro.com</span>
                    </div>
                  </a>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                      <Clock size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Business Hours</span>
                      <span className="text-lg font-bold text-slate-900">Mon-Sat, 8am - 6pm</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6">Service Areas</h2>
                <div className="flex flex-wrap gap-2">
                  {["Denver", "Aurora", "Centennial", "Parker", "Littleton", "Highlands Ranch", "Lakewood"].map((city) => (
                    <span key={city} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm">
                      {city}
                    </span>
                  ))}
                  <span className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg text-sm font-bold text-accent">
                    & Surrounding Metro
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Name</label>
                    <input
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your Full Name"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Phone</label>
                    <div className="relative">
                      <input
                        name="phone"
                        required
                        type="tel"
                        value={phoneValue}
                        onChange={handlePhoneChange}
                        className={`w-full px-5 py-4 bg-slate-50 border ${phoneValid === true ? 'border-green-500' : phoneValid === false ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium`}
                        placeholder="(720) 000-0000"
                      />
                      {phoneValid === true && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <CheckCircle className="text-accent-accessible" size={20} />
                        </div>
                      )}
                      {phoneValid === false && phoneValue && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <X className="text-red-500" size={20} />
                        </div>
                      )}
                    </div>
                    {phoneError && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{phoneError}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                  <div className="relative">
                    <input
                      name="email"
                      required
                      type="email"
                      value={emailValue}
                      onChange={handleEmailChange}
                      className={`w-full px-5 py-4 bg-slate-50 border ${emailValid === true ? 'border-green-500' : emailValid === false ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium`}
                      placeholder="your@email.com"
                    />
                    {emailValid === true && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CheckCircle className="text-accent-accessible" size={20} />
                      </div>
                    )}
                    {emailValid === false && emailValue && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <X className="text-red-500" size={20} />
                      </div>
                    )}
                  </div>
                  {emailError && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{emailError}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Message</label>
                  <textarea
                    name="message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="How can we help you?"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium resize-none"
                  ></textarea>
                </div>

                {/* reCAPTCHA */}
                {captchaConfig?.is_enabled && (
                  <div className="min-h-[78px]">
                    {(!captchaConfig.provider || captchaConfig.provider === 'google_v2') && (
                      <ReCAPTCHA
                        sitekey={captchaConfig.site_key || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_M"}
                        onChange={handleRecaptchaChange}
                        onErrored={() => setRecaptchaError("Security check failed to load.")}
                      />
                    )}

                    {captchaConfig.provider === 'google_v3' && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 italic flex items-center gap-2">
                        Protected by Google reCAPTCHA
                        <ReCAPTCHA
                          sitekey={captchaConfig.site_key}
                          size="invisible"
                          onChange={handleRecaptchaChange}
                        />
                      </div>
                    )}

                    {captchaConfig.provider === 'cloudflare_turnstile' && (
                      <Turnstile
                        siteKey={captchaConfig.site_key}
                        onSuccess={handleRecaptchaChange}
                        onError={() => setRecaptchaError("Security check failed.")}
                        className="cf-turnstile"
                      />
                    )}

                    {captchaConfig.provider === 'hcaptcha' && (
                      <HCaptcha
                        sitekey={captchaConfig.site_key}
                        onVerify={handleRecaptchaChange}
                        onError={() => setRecaptchaError("Security check failed.")}
                      />
                    )}

                    {recaptchaError && (
                      <p className="text-xs font-bold text-red-500 mt-2">{recaptchaError}</p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Send Message
                      <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="h-[400px] w-full bg-slate-200 relative grayscale hover:grayscale-0 transition-all duration-700">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d196235.8893922718!2d-105.10190505!3d39.7392358!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b80aa231f17cf%3A0x118ef4af2d49d0f!2sDenver%2C%20CO!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </section>

      <Footer onGetQuote={() => setIsModalOpen(true)} />
      <QuoteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <BackToTop />

      {/* LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "SocialBluePro Landscaping",
            "image": "https://socialbluepro.com/imgs/Imgs_WEBP/logo.webp",
            "telephone": "(720) 737-4607",
            "email": "contact@socialbluepro.com",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Denver",
              "addressRegion": "CO",
              "addressCountry": "US"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 39.7392,
              "longitude": -104.9903
            },
            "url": "https://socialbluepro.com",
            "openingHoursSpecification": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
              ],
              "opens": "08:00",
              "closes": "18:00"
            },
            "areaServed": "Denver Metro Area"
          })
        }}
      />
    </main>
  );
}
