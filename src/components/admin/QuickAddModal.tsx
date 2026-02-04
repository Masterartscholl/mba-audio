"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

interface QuickAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'category' | 'genre';
    categoryId?: string | number;
    onSuccess: () => void;
}

export const QuickAddModal = ({
    isOpen,
    onClose,
    type,
    categoryId,
    onSuccess
}: QuickAddModalProps) => {
    const t = useTranslations('Categories');
    const tc = useTranslations('Common');
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name) return;
        if (type === 'genre' && !categoryId) return;

        setLoading(true);
        try {
            let error;
            if (type === 'category') {
                const res = await supabase.from('categories').insert([{ name }]);
                error = res.error;
            } else {
                const res = await supabase.from('genres').insert([{ name, category_id: Number(categoryId) }]);
                error = res.error;
            }

            if (error) throw error;
            onSuccess();
            setName("");
            onClose();
        } catch (error: any) {
            alert(tc('error') + ": " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const titleText = type === 'category' ? t('addCategory') : t('addGenre');
    const placeholderText = type === 'category' ? t('placeholder') : t('genrePlaceholder');

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[#151e32] border border-[#2A3B55] w-full max-w-sm rounded-2xl shadow-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-4">{titleText}</h3>
                <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3 text-white focus:border-[#ede066] mb-4 outline-none"
                    placeholder={placeholderText}
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-400 hover:text-white bg-[#0b1121] rounded-xl font-medium transition-colors">
                        {tc('cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !name}
                        className="flex-1 py-3 bg-[#ede066] text-black font-bold rounded-xl hover:bg-[#d4c95b] transition-all disabled:opacity-50"
                    >
                        {loading ? "..." : tc('save')}
                    </button>
                </div>
            </div>
        </div>
    );
};
