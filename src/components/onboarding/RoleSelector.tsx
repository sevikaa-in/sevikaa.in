"use client";

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Briefcase, UserCheck } from 'lucide-react';

interface RoleSelectorProps {
  onSelect: (role: 'worker' | 'employer') => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelect }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8 max-w-md mx-auto w-full text-center">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 w-full">
        <h2 className="text-xl font-bold text-[#202124] mb-1">Tell us who you are</h2>
        <p className="text-sm text-gray-500 mb-6">Choose your account type to proceed</p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => onSelect('worker')}
            className="p-6 rounded-2xl border-2 border-gray-200 hover:border-[#1A73E8] active:scale-[0.98] transition-all flex items-center text-left w-full gap-4 group"
          >
            <div className="p-4 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] group-hover:bg-[#1A73E8] group-hover:text-white transition-all">
              <Briefcase size={28} />
            </div>
            <div>
              <span className="block text-lg font-bold text-[#202124]">I want to Work</span>
              <span className="block text-xs text-gray-400 mt-0.5">Find Maid, Cook, or Nanny jobs near you</span>
            </div>
          </button>

          <button
            onClick={() => onSelect('employer')}
            className="p-6 rounded-2xl border-2 border-gray-200 hover:border-[#34A853] active:scale-[0.98] transition-all flex items-center text-left w-full gap-4 group"
          >
            <div className="p-4 rounded-xl bg-[#34A853]/10 text-[#34A853] group-hover:bg-[#34A853] group-hover:text-white transition-all">
              <UserCheck size={28} />
            </div>
            <div>
              <span className="block text-lg font-bold text-[#202124]">I want to Hire</span>
              <span className="block text-xs text-gray-400 mt-0.5">Find verified domestic workers for your home</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
