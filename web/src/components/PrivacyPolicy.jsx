import React, { useState, useRef, useMemo } from 'react';
import { ArrowLeft, Edit3, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const PrivacyPolicy = ({ user }) => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);

    // Check is_admin flag primarily, with role fallbacks for robustness
    const isAdmin = user?.is_admin === true ||
        user?.role === 'Admin' ||
        user?.role === 'Administrator' ||
        user?.role === 'Project Manager' ||
        user?.role === 'Advisor-Technology & Operations';

    // Comprehensive content in HTML format for the Markwave HR Portal
    const [content, setContent] = useState(`
        <h1 style="font-size: 32px; font-weight: bold; color: #1e293b; margin-bottom: 24px;">Privacy Policy & Terms and Conditions</h1>
        <p style="color: #64748b; font-weight: 500; margin-bottom: 32px;">Last Updated: 2/24/2026</p>
        
        <h2 style="font-size: 26px; font-weight: 800; color: #1e293b; margin-top: 56px; margin-bottom: 24px;">Privacy Policy</h2>
        <p style="color: #64748b; font-size: 18px; line-height: 1.8; margin-bottom: 24px;">At Markwave HR, we value your privacy and are committed to protecting your personal data. This Privacy Policy outlines how we collect, use, and safeguard your information when you use our HR Portal.</p>

        <h3 style="font-size: 22px; font-weight: 700; color: #1e293b; margin-top: 40px; margin-bottom: 20px;">1. Information We Collect</h3>
        <p style="color: #64748b; font-size: 18px; line-height: 1.6; margin-bottom: 24px;">To provide a comprehensive HR management experience, we collect various types of information:</p>
        <ul style="list-style-type: none; padding-left: 0;">
            <li style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px;">
                <span style="margin-top: 8px; width: 8px; height: 8px; border-radius: 50%; background-color: #38bdf8; flex-shrink: 0;"></span>
                <p style="color: #64748b; font-size: 18px; line-height: 1.6;">
                    <strong style="color: #1e293b;">Personal Identity Information:</strong> Legal name, gender, date of birth, nationality, and government-issued identification numbers where applicable.
                </p>
            </li>
            <li style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px;">
                <span style="margin-top: 8px; width: 8px; height: 8px; border-radius: 50%; background-color: #38bdf8; flex-shrink: 0;"></span>
                <p style="color: #64748b; font-size: 18px; line-height: 1.6;">
                    <strong style="color: #1e293b;">Employment Details:</strong> Professional role, department, employee ID, work location, date of joining, reporting hierarchy, and work history.
                </p>
            </li>
            <li style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px;">
                <span style="margin-top: 8px; width: 8px; height: 8px; border-radius: 50%; background-color: #38bdf8; flex-shrink: 0;"></span>
                <p style="color: #64748b; font-size: 18px; line-height: 1.6;">
                    <strong style="color: #1e293b;">Contact Information:</strong> Professional and personal email addresses, registered mobile number for OTP verification, and emergency contact details.
                </p>
            </li>
            <li style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px;">
                <span style="margin-top: 8px; width: 8px; height: 8px; border-radius: 50%; background-color: #38bdf8; flex-shrink: 0;"></span>
                <p style="color: #64748b; font-size: 18px; line-height: 1.6;">
                    <strong style="color: #1e293b;">Payroll & Financial Data:</strong> Bank account details, tax identification numbers, and compensation structure required for salary processing.
                </p>
            </li>
        </ul>

        <h3 style="font-size: 22px; font-weight: 700; color: #1e293b; margin-top: 40px; margin-bottom: 20px;">2. How We Use Your Information</h3>
        <p style="color: #64748b; font-size: 18px; line-height: 1.6; margin-bottom: 24px;">The information collected is utilized strictly for legitimate business and HR administration purposes:</p>
        <ul style="list-style-type: none; padding-left: 0;">
            <li style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px;">
                <span style="margin-top: 8px; width: 8px; height: 8px; border-radius: 50%; background-color: #38bdf8; flex-shrink: 0;"></span>
                <p style="color: #64748b; font-size: 18px; line-height: 1.6;">
                    <strong style="color: #1e293b;">Operational Management:</strong> Facilitating attendance tracking, leave applications, performance reviews, and employee life-cycle events.
                </p>
            </li>
            <li style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px;">
                <span style="margin-top: 8px; width: 8px; height: 8px; border-radius: 50%; background-color: #38bdf8; flex-shrink: 0;"></span>
                <p style="color: #64748b; font-size: 18px; line-height: 1.6;">
                    <strong style="color: #1e293b;">Security & Authentication:</strong> Utilizing your contact info for secure Two-Factor Authentication (2FA) and detecting unauthorized portal access.
                </p>
            </li>
            <li style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px;">
                <span style="margin-top: 8px; width: 8px; height: 8px; border-radius: 50%; background-color: #38bdf8; flex-shrink: 0;"></span>
                <p style="color: #64748b; font-size: 18px; line-height: 1.6;">
                    <strong style="color: #1e293b;">Legal Compliance:</strong> Ensuring adherence to local labor laws, tax regulations, and statutory reporting requirements.
                </p>
            </li>
        </ul>

        <h3 style="font-size: 22px; font-weight: 700; color: #1e293b; margin-top: 40px; margin-bottom: 20px;">3. Data Sharing & Disclosure</h3>
        <p style="color: #64748b; font-size: 18px; line-height: 1.8; margin-bottom: 24px;">We do not sell your personal data. Information is shared only with authorized personnel within the organization (HR, Finance, IT) and trusted third-party service providers (e.g., payroll processors, insurance providers) under strict confidentiality agreements.</p>

        <h3 style="font-size: 22px; font-weight: 700; color: #1e293b; margin-top: 40px; margin-bottom: 20px;">4. Data Security & Storage</h3>
        <p style="color: #64748b; font-size: 18px; line-height: 1.8; margin-bottom: 24px;">Your data is stored securely using advanced encryption standards both in transit and at rest. We conduct regular security audits and implement strict access control policies to prevent data breaches.</p>

        <h2 style="font-size: 26px; font-weight: 800; color: #1e293b; margin-top: 64px; margin-bottom: 24px; border-top: 1px solid #f1f5f9; padding-top: 48px;">Terms and Conditions</h2>
        <p style="color: #64748b; font-size: 18px; line-height: 1.8; margin-bottom: 24px;">By accessing and using the Markwave HR Portal, you agree to comply with and be bound by the following terms and conditions.</p>
        
        <h3 style="font-size: 22px; font-weight: 700; color: #1e293b; margin-top: 40px; margin-bottom: 20px;">1. Acceptance of Terms</h3>
        <p style="color: #64748b; font-size: 18px; line-height: 1.8; margin-bottom: 24px;">These terms constitute a legal agreement between you and Markwave regarding the use of the platform. If you do not agree, you must immediately cease using the portal.</p>

        <h3 style="font-size: 22px; font-weight: 700; color: #1e293b; margin-top: 40px; margin-bottom: 20px;">2. Authorized Use & Account Responsibility</h3>
        <ul style="list-style-type: none; padding-left: 0;">
            <li style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px;">
                <span style="margin-top: 8px; width: 8px; height: 8px; border-radius: 50%; background-color: #38bdf8; flex-shrink: 0;"></span>
                <p style="color: #64748b; font-size: 18px; line-height: 1.6;">
                    <strong style="color: #1e293b;">Credential Confidentiality:</strong> You are solely responsible for maintaining the privacy of your login credentials and for all activities that occur under your account.
                </p>
            </li>
            <li style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px;">
                <span style="margin-top: 8px; width: 8px; height: 8px; border-radius: 50%; background-color: #38bdf8; flex-shrink: 0;"></span>
                <p style="color: #64748b; font-size: 18px; line-height: 1.6;">
                    <strong style="color: #1e293b;">Prohibited Sharing:</strong> Sharing account access or credentials with colleagues or third parties is strictly prohibited and may result in disciplinary action.
                </p>
            </li>
        </ul>

        <h3 style="font-size: 22px; font-weight: 700; color: #1e293b; margin-top: 40px; margin-bottom: 20px;">3. Conduct & Integrity</h3>
        <p style="color: #64748b; font-size: 18px; line-height: 1.8; margin-bottom: 24px;">Users must provide accurate, current, and complete information for all HR processes. Misrepresentation of facts, fraudulent attendance marking, or unauthorized data manipulation is a violation of company policy and these terms.</p>

        <h3 style="font-size: 22px; font-weight: 700; color: #1e293b; margin-top: 40px; margin-bottom: 20px;">4. Termination of Access</h3>
        <p style="color: #64748b; font-size: 18px; line-height: 1.8; margin-bottom: 24px;">Markwave reserves the right to suspend or terminate your access to the portal at any time, without notice, for conduct that violates these terms or organizational policies.</p>

        <h3 style="font-size: 22px; font-weight: 700; color: #1e293b; margin-top: 40px; margin-bottom: 20px;">5. Intellectual Property</h3>
        <p style="color: #64748b; font-size: 18px; line-height: 1.8; margin-bottom: 24px;">All content, design, software, and logic within the HR Portal are the intellectual property of Markwave and may not be copied, modified, or redistributed without explicit written consent.</p>

        <div style="margin-top: 64px; text-align: center; color: #94a3b8; font-size: 14px; border-top: 1px solid #f1f5f9; padding-top: 40px;">
            <p>© 2026 Markwave HR. All rights reserved.</p>
            <p style="margin-top: 8px;">The use of this platform is subject to the company's internal code of conduct and the terms mentioned above.</p>
        </div>
    `);

    const quillRef = useRef(null);

    // Custom toolbar configuration
    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'align': [] }],
                [{ 'indent': '-1' }, { 'indent': '+1' }],
                ['link', 'image'],
                ['clean']
            ]
        }
    }), []);

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent', 'align',
        'link', 'image'
    ];

    const handleSave = () => {
        setIsEditing(false);
        console.log("Saved content:", content);
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[1400px] mx-auto pt-10 px-8 mm:px-12 ml:px-16 flex justify-between items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>

                <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm transition-all ${isEditing
                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20'
                        : 'bg-[#4381ff] hover:bg-[#3b71e0] text-white shadow-lg shadow-blue-500/20'
                        }`}
                >
                    {isEditing ? (
                        <>
                            <Save size={16} />
                            <span>Save Policy</span>
                        </>
                    ) : (
                        <>
                            <Edit3 size={16} />
                            <span>Edit Policy</span>
                        </>
                    )}
                </button>
            </div>

            <main className="max-w-[1400px] mx-auto py-12 px-8 mm:px-12 ml:px-16">
                <div className="max-w-4xl">
                    {isEditing ? (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            <div className="mb-6 flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div>
                                    <h3 className="text-lg font-bold text-[#1e293b]">Editor Mode</h3>
                                    <p className="text-sm text-gray-400">Edit your policy using the rich text tools below.</p>
                                </div>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="quill-editor-wrapper">
                                <ReactQuill
                                    ref={quillRef}
                                    theme="snow"
                                    value={content}
                                    onChange={setContent}
                                    modules={modules}
                                    formats={formats}
                                    className="bg-white rounded-xl"
                                />
                            </div>

                            <style jsx global>{`
                                .quill-editor-wrapper .ql-container {
                                    min-height: 600px;
                                    font-size: 18px;
                                    border-bottom-left-radius: 12px;
                                    border-bottom-right-radius: 12px;
                                    border-color: #f3f4f6 !important;
                                }
                                .quill-editor-wrapper .ql-toolbar {
                                    border-top-left-radius: 12px;
                                    border-top-right-radius: 12px;
                                    border-color: #f3f4f6 !important;
                                    background: #fbfcff;
                                    padding: 12px !important;
                                    position: sticky;
                                    top: 0;
                                    z-index: 10;
                                }
                                .quill-editor-wrapper .ql-editor {
                                    padding: 40px !important;
                                    line-height: 1.8;
                                    color: #4b5563;
                                }
                            `}</style>
                        </div>
                    ) : (
                        <div
                            className="prose prose-lg max-w-none animate-in fade-in slide-in-from-bottom-4 duration-500"
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    )}

                    {!isEditing && (
                        <div className="mt-12 pb-20 invisible">
                            {/* Spacing for mobile footer */}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
