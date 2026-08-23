"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Menu, X, ArrowRight, UserCheck, Briefcase,
  LayoutDashboard, ShieldCheck, ShieldAlert, User
} from 'lucide-react';

export function PublicNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'employer' | 'worker' | 'admin' | 'super_admin'>('employer');

  const resolveRole = async (user: any) => {
    // 1. Check user metadata first
    let role = user.user_metadata?.role;

    // 2. Check cookie if metadata missing
    if (!role && typeof document !== 'undefined') {
      role = document.cookie
        .split('; ')
        .find(row => row.startsWith('sevikaa_user_role='))
        ?.split('=')[1];
    }

    // 3. Query Supabase profiles table as authoritative fallback
    if (!role || role === 'undefined') {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (data?.role) {
          role = data.role;
        }
      } catch (e) {
        console.warn("Could not fetch profile role:", e);
      }
    }

    // Standardize role value
    const normalizedRole = (role || '').toLowerCase();
    if (normalizedRole === 'super_admin' || normalizedRole === 'superadmin') {
      setUserRole('super_admin');
    } else if (normalizedRole === 'admin') {
      setUserRole('admin');
    } else if (normalizedRole === 'worker') {
      setUserRole('worker');
    } else {
      setUserRole('employer');
    }
  };

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setLoggedInUser(session.user);
          await resolveRole(session.user);
        } else {
          setLoggedInUser(null);
        }
      } catch (err) {
        console.warn("PublicNavbar session check warning:", err);
      }
    };

    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setLoggedInUser(session.user);
        await resolveRole(session.user);
      } else {
        setLoggedInUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const navLinks = [
    { href: '/about', label: 'About Us' },
    { href: '/societies', label: 'Societies' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/safety', label: 'Safety' },
    { href: '/contact', label: 'Contact' },
    { href: '/faq', label: 'FAQ' },
  ];

  const getDashboardConfig = () => {
    if (userRole === 'super_admin') {
      return {
        label: 'Super Admin Console',
        href: '/super-admin',
        colorClass: 'bg-purple-700 hover:bg-purple-800 text-white shadow-purple-500/20',
        icon: <ShieldAlert size={15} />
      };
    }
    if (userRole === 'admin') {
      return {
        label: 'Admin Panel',
        href: '/admin',
        colorClass: 'bg-slate-900 hover:bg-black text-white shadow-slate-900/20',
        icon: <ShieldCheck size={15} />
      };
    }
    if (userRole === 'worker') {
      return {
        label: 'Worker Dashboard',
        href: '/worker',
        colorClass: 'bg-[#34A853] hover:bg-emerald-600 text-white shadow-emerald-500/20',
        icon: <LayoutDashboard size={15} />
      };
    }
    return {
      label: 'Employer Dashboard',
      href: '/employer',
      colorClass: 'bg-[#1A73E8] hover:bg-blue-600 text-white shadow-blue-500/20',
      icon: <LayoutDashboard size={15} />
    };
  };

  const dashConfig = getDashboardConfig();

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

        {/* Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <img
            src="/logo.png"
            alt="Sevikaa Logo"
            className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black tracking-tight leading-none">
              <span className="text-[#1A73E8]">S</span>
              <span className="text-[#EA4335]">e</span>
              <span className="text-[#FBBC05]">v</span>
              <span className="text-[#1A73E8]">i</span>
              <span className="text-[#34A853]">k</span>
              <span className="text-[#EA4335]">a</span>
              <span className="text-[#EA4335]">a</span>
            </span>
            <span className="text-[9px] font-extrabold uppercase text-[#2E7D32] tracking-wider mt-0.5 hidden sm:block">
              Verified Domestic Help
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs sm:text-sm font-extrabold text-slate-600">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-[#1A73E8] transition-all relative py-1 ${
                  isActive ? 'text-[#1A73E8] font-black' : ''
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#1A73E8] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Far Right Header Actions (Conditional on Auth) */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          {loggedInUser ? (
            <Link
              href={dashConfig.href}
              className={`px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer ${dashConfig.colorClass}`}
            >
              {dashConfig.icon}
              <span>{dashConfig.label}</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link
                href="/?role=worker"
                className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300/80 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <UserCheck size={14} className="text-emerald-600" />
                <span>Looking for Work?</span>
              </Link>

              <Link
                href="/?role=employer"
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <span>Hire Help</span>
                <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 animate-fade-in shadow-xl">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-extrabold flex items-center justify-between ${
                    isActive
                      ? 'bg-blue-50 text-[#1A73E8]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8]" />}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {loggedInUser ? (
              <Link
                href={dashConfig.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full py-3 text-white rounded-xl text-xs font-black text-center shadow-md flex items-center justify-center gap-2 ${dashConfig.colorClass}`}
              >
                {dashConfig.icon}
                <span>{dashConfig.label}</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link
                  href="/?role=worker"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-black text-center flex items-center justify-center gap-1.5"
                >
                  <UserCheck size={14} />
                  <span>Looking for Work?</span>
                </Link>
                <Link
                  href="/?role=employer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 bg-[#1A73E8] text-white rounded-xl text-xs font-black text-center shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Hire Domestic Help</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
