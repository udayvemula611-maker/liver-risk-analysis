
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

/**
 * CreateUserModal Component
 *
 * This modal allows administrators to create new user accounts with different roles (patient or doctor).
 * It includes fields for full name, email, password, role, age, gender, and an option to assign a doctor
 * if the new user is a patient.
 *
 * @param {object} props - The properties for the component.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {() => void} props.onClose - Callback function to close the modal.
 * @param {() => void} props.onSuccess - Callback function to be called upon successful user creation.
 * @param {{ id: string; full_name: string }[]} [props.doctors=[]] - Optional array of doctor objects to assign patients to.
 */
export default function CreateUserModal({ isOpen, onClose, onSuccess, doctors = [] }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, doctors?: { id: string; full_name: string }[] }) {
    const router = useRouter();
    // State to manage the loading status during form submission.
    const [loading, setLoading] = useState(false);
    // State to store form data for new user creation.
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'patient', // Default role is 'patient'.
        age: '',
        gender: 'Male', // Default gender is 'Male'.
        assigned_doctor: '' // Doctor ID if the user is a patient.
    });

    // If the modal is not open, render nothing.
    if (!isOpen) return null;

    /**
     * Handles the form submission for creating a new user.
     * @param {React.FormEvent} e - The form event.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); // Set loading to true when submission starts.

        try {
            // Send a POST request to the user creation API endpoint.
            const res = await fetch('/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData) // Send form data as JSON.
            });

            const data = await res.json(); // Parse the JSON response.

            if (!res.ok) {
                // If the response is not OK, display an error toast.
                toast.error(data.error || 'Failed to create user');
            } else {
                // On successful creation, display a success toast and reset form.
                toast.success(data.message);
                setFormData({ full_name: '', email: '', password: '', role: 'patient', age: '', gender: 'Male', assigned_doctor: '' });
                onSuccess(); // Call the onSuccess callback.
                onClose();   // Close the modal.
                router.refresh(); // Refresh the router to update user lists.
            }
        } catch (error) {
            // Catch and display unexpected errors during the API call.
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false); // Always set loading to false after the operation completes.
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-[#1E3A8A]">Create New User</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        {/* Close button icon */}
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* User Creation Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Full Name Input */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] text-gray-900 bg-white outline-none transition-colors"
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>
                    {/* Email Address Input */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] text-gray-900 bg-white outline-none transition-colors"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    {/* Temporary Password Input */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Temporary Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] text-gray-900 bg-white outline-none transition-colors"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    {/* System Role Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">System Role</label>
                        <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] text-gray-900 outline-none transition-colors bg-white"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                        </select>
                    </div>

                    {/* Patient-specific Fields (conditionally rendered) */}
                    {formData.role === 'patient' && (
                        <>
                            <div className="flex gap-4">
                                {/* Age Input */}
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-800 mb-1">Age</label>
                                    <input
                                        type="number"
                                        required={formData.role === 'patient'}
                                        min="1"
                                        max="120"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] text-gray-900 bg-white outline-none transition-colors"
                                        value={formData.age}
                                        onChange={e => setFormData({ ...formData, age: e.target.value })}
                                    />
                                </div>
                                {/* Gender Selection */}
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-800 mb-1">Gender</label>
                                    <select
                                        required={formData.role === 'patient'}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] text-gray-900 outline-none transition-colors bg-white"
                                        value={formData.gender}
                                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            {/* Assign Doctor Selection */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-1">Assign Doctor</label>
                                <select
                                    required={formData.role === 'patient'}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] text-gray-900 outline-none transition-colors bg-white disabled:opacity-50"
                                    value={formData.assigned_doctor}
                                    onChange={e => setFormData({ ...formData, assigned_doctor: e.target.value })}
                                >
                                    <option value="" disabled>-- Select a Doctor --</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>{d.full_name}</option>
                                    ))}
                                    {doctors.length === 0 && <option value="" disabled>No doctors available in system</option>}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#152b66] font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
