"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BandeForm } from "@/components/bandes/BandeForm";

export default function NouvelleBandePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link
            href="/bandes"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="page-title">Nouvelle Bande</h1>
            <p className="text-sm text-gray-500 mt-0.5">Enregistrez un nouveau lot de poussins</p>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 pb-8">
        <BandeForm />
      </div>
    </div>
  );
}
