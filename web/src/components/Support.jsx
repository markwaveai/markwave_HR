import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, Send, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Support = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);

    const faqs = [
        {
            question: "How do I update my profile information?",
            answer: "You can update your profile information by navigating to the 'Me' section and clicking on the 'Edit Profile' button. From there, you can change your contact details, emergency contacts, and professional bio."
        },
        {
            question: "Where can I view my monthly payslips?",
            answer: "Monthly payslips are available in the 'Finance' or 'Payroll' section of your dashboard. You can view, download, or print your payslips for the current and previous financial years."
        },
        {
            question: "How can I apply for leave or check my balance?",
            answer: "Go to the 'Leave & Attendance' section to view your current leave balances for Privilege Leave, Sick Leave, and Casual Leave. You can apply for new leave using the 'Apply for Leave' button."
        },
        {
            question: "I'm having trouble with Two-Factor Authentication.",
            answer: "If you are not receiving OTPs on your mobile, please ensure your registered number is correct. You can also try using the 'Email OTP' option on the login page for an alternative verification method."
        },
        {
            question: "What should I do if my attendance is marked incorrectly?",
            answer: "If there's a discrepancy in your attendance, you can submit an 'Attendance Regularization' request through the Leave & Attendance portal. Your manager will then review and approve the correction."
        },
        {
            question: "How do I claim reimbursement for business expenses?",
            answer: "Reimbursements can be claimed under the 'Expenses' module. Please upload clear scans of your bills and categorize the expense appropriately (e.g., Travel, Food, Internet) for faster processing."
        },
        {
            question: "Can I refer a candidate for an open position?",
            answer: "Yes! Markwave encourages employee referrals. Visit the 'Careers' or 'Internal Job Postings' section to see open roles and submit your referral's details and resume."
        },
        {
            question: "How do I reset my portal password?",
            answer: "Since we use OTP-based login for enhanced security, you don't need a traditional password. Simply log in using your registered mobile number or email and enter the 6-digit code sent to you."
        },
        {
            question: "How do I delete my account?",
            answer: "Account deletion is a permanent action. If you wish to proceed, please fill out the contact form with the subject 'Account Deletion' or contact your HR administrator directly. We will process your request within 48 hours."
        }
    ];

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Navigation Header */}
            <div className="max-w-[1400px] mx-auto pt-4 px-8 flex items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-white rounded-full transition-all text-gray-400 hover:text-gray-600 shadow-sm"
                >
                    <ArrowLeft size={18} />
                </button>
            </div>

            <main className="max-w-6xl mx-auto py-6 px-6">
                {/* Main Header */}
                <div className="text-center mb-16">
                    <h1 className="text-[40px] font-bold text-[#1e293b] mb-4">Contact Support</h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
                        We are here to help. Check our FAQs below or fill out the form to get in touch with our team.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12 items-start">
                    {/* FAQ Section */}
                    <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-1.5 h-8 bg-[#0da487] rounded-full"></div>
                            <h2 className="text-2xl font-bold text-[#1e293b]">Frequently Asked Questions</h2>
                        </div>

                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all duration-300"
                                >
                                    <button
                                        onClick={() => toggleFaq(index)}
                                        className="w-full px-8 py-6 flex items-center justify-between text-left group"
                                    >
                                        <span className={`text-[17px] font-bold transition-colors ${openFaq === index ? 'text-[#0da487]' : 'text-[#1e293b] group-hover:text-[#0da487]'}`}>
                                            {faq.question}
                                        </span>
                                        <ChevronDown
                                            size={20}
                                            className={`text-gray-400 transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-[#0da487]' : ''}`}
                                        />
                                    </button>

                                    <div
                                        className={`transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}
                                    >
                                        <div className="px-8 pb-8 text-gray-500 leading-relaxed text-[16px]">
                                            {faq.answer}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Form Section */}
                    <div className="lg:w-[450px] w-full bg-white rounded-[32px] p-10 shadow-xl shadow-blue-900/5 border border-gray-50">
                        <h2 className="text-2xl font-bold text-[#1e293b] mb-8">Send us a message</h2>

                        <form className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-500">First Name</label>
                                    <input
                                        type="text"
                                        placeholder="John"
                                        className="w-full px-4 py-3.5 bg-[#F8FAFC] border border-gray-100 rounded-xl focus:outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all text-gray-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-500">Last Name</label>
                                    <input
                                        type="text"
                                        placeholder="Doe"
                                        className="w-full px-4 py-3.5 bg-[#F8FAFC] border border-gray-100 rounded-xl focus:outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all text-gray-700"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-500">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    className="w-full px-4 py-3.5 bg-[#F8FAFC] border border-gray-100 rounded-xl focus:outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all text-gray-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-500">Phone Number</label>
                                <input
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    className="w-full px-4 py-3.5 bg-[#F8FAFC] border border-gray-100 rounded-xl focus:outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all text-gray-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-500">How can we help you?</label>
                                <textarea
                                    rows="4"
                                    placeholder="Tell us more about your issue..."
                                    className="w-full px-4 py-3.5 bg-[#F8FAFC] border border-gray-100 rounded-xl focus:outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all text-gray-700 resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="button"
                                className="w-full py-4 bg-[#1e293b] text-white font-bold rounded-2xl hover:bg-[#2d3a4f] transition-all transform active:scale-[0.98] shadow-lg shadow-gray-200 flex items-center justify-center gap-2 mt-4"
                            >
                                <Send size={18} />
                                <span>Submit Message</span>
                            </button>


                        </form>
                    </div>
                </div>

                {/* Footer Copy */}
                <div className="mt-20 text-center text-gray-400 text-sm">
                    <p>© 2026 Markwave HR Portal. Professional Support Services.</p>
                </div>
            </main>
        </div>
    );
};

export default Support;
