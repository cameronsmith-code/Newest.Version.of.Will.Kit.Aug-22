import { FileText, Shield, Download, Clock } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-white mb-6">About Estate Planner</h1>

      <div className="bg-gray-800 p-8 rounded-lg shadow-md mb-8 border border-gray-700">
        <p className="text-lg text-gray-200 mb-4">
          Estate Planner is a simple, privacy-focused tool designed to help you
          organize important information for estate planning purposes.
        </p>
        <p className="text-gray-300">
          We believe estate planning shouldn't be complicated or expensive to get started.
          Our questionnaire helps you gather the essential information you need, and generates
          a comprehensive fillable PDF that you can complete over time at your own pace.
        </p>
      </div>

      <h2 className="text-2xl font-semibold mb-6 text-white">Why Estate Planner?</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
          <Clock className="w-10 h-10 text-blue-400 mb-3" />
          <h3 className="text-xl font-semibold mb-2 text-white">Quick to Start</h3>
          <p className="text-gray-400">
            Answer just a few simple questions and get a comprehensive PDF in minutes.
            No lengthy forms or complicated processes.
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
          <Shield className="w-10 h-10 text-green-400 mb-3" />
          <h3 className="text-xl font-semibold mb-2 text-white">Privacy First</h3>
          <p className="text-gray-400">
            Your information is stored locally in your browser. No accounts, no servers,
            no data collection. Complete privacy and security.
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
          <Download className="w-10 h-10 text-orange-400 mb-3" />
          <h3 className="text-xl font-semibold mb-2 text-white">Portable Format</h3>
          <p className="text-gray-400">
            Download a PDF that you own and control. Print it, save it,
            share it with your family or attorney as needed.
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
          <FileText className="w-10 h-10 text-blue-400 mb-3" />
          <h3 className="text-xl font-semibold mb-2 text-white">Comprehensive</h3>
          <p className="text-gray-400">
            The generated PDF includes sections for all important estate planning
            information you'll need to document.
          </p>
        </div>
      </div>
    </div>
  );
}
