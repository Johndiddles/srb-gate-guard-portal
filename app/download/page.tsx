import { Download, Smartphone } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function DownloadPage() {
  // Placeholder Cloudinary URL; replace with the actual endpoint link.
  const downloadUrl =
    "https://res.cloudinary.com/demo/image/upload/v1234567890/srb-gate-guard.apk";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 w-full h-1/2 bg-emerald-600 rounded-b-[40%] shadow-lg transform -translate-y-12"></div>

      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 sm:p-16 text-center z-10 border border-slate-100">
        <div className="mx-auto w-24 h-24 bg-emerald-100 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
          <Smartphone className="w-12 h-12 text-emerald-600" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Gate Guard Mobile
        </h1>

        <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-lg mx-auto">
          The official SRB Gate Guard app. Automate vehicular movements, manage
          guest lists, and securely track staff parking directly from your
          Android device.
        </p>

        <a
          href={downloadUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold py-4 px-8 rounded-full transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 w-full sm:w-auto"
        >
          <Download className="w-6 h-6" />
          Download for Android
        </a>

        <div className="mt-10 pt-8 border-t border-slate-100">
          <p className="text-sm text-slate-400">
            For internal organizational use only. Requires provisioned
            credentials to activate.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors"
          >
            Return to Admin Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
