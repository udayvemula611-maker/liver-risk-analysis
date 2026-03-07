'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, PlusCircle, Users } from 'lucide-react';
// Import the shared utility function for combining and merging Tailwind CSS classes.
import { cn } from '@/lib/utils';

/**
 * Sidebar Component
 *
 * This component renders the application's sidebar navigation. It dynamically
 * displays different sets of navigation links based on the authenticated user's role.
 * The active link is highlighted based on the current URL pathname.
 *
 * @param {object} props - The properties for the component.
 * @param {'admin' | 'doctor' | 'patient'} props.role - The role of the current user, which dictates the navigation links shown.
 */
export default function Sidebar({ role }: { role: 'admin' | 'doctor' | 'patient' }) {
    const pathname = usePathname(); // Get the current pathname to highlight the active link.

    // Define navigation routes for each user role.
    const routes = {
        admin: [
            { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
            { name: 'Users', href: '/admin/users', icon: Users },
            { name: 'Templates', href: '/admin/templates', icon: FileText },
        ],
        doctor: [
            { name: 'Dashboard', href: '/doctor', icon: LayoutDashboard },
            { name: 'My Patients', href: '/doctor/patients', icon: Users },
            { name: 'New Analysis', href: '/doctor/new-report', icon: PlusCircle },
        ],
        patient: [
            { name: 'My Reports', href: '/patient', icon: FileText },
        ]
    };

    // Select the appropriate links based on the user's role.
    const links = routes[role] || [];

    return (
        <div className="pb-12 w-64 border-r border-gray-200 min-h-[calc(100vh-3.5rem)] bg-white hidden md:block shadow-[1px_0_5px_rgba(0,0,0,0.02)]">
            <div className="space-y-4 py-6">
                <div className="px-3 py-2">
                    {/* Dashboard Title based on user role. */}
                    <h2 className="mb-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {role} Dashboard
                    </h2>
                    {/* Navigation Links: Dynamically generated based on the user's role. */}
                    <div className="space-y-1 text-sm font-medium">
                        {links.map((link) => {
                            const Icon = link.icon; // Icon component for the link.
                            const isActive = pathname === link.href; // Check if the current link is active.
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-4 py-3 transition-all",
                                        // Apply active or inactive styling based on `isActive`.
                                        isActive
                                            ? "bg-blue-50 text-[#1E3A8A] font-semibold"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-[#1E3A8A]"
                                    )}
                                >
                                    {/* Icon for the navigation link, with dynamic color. */}
                                    <Icon className={cn("h-5 w-5", isActive ? "text-[#3B82F6]" : "text-gray-400")} />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
