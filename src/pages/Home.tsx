import { Link } from 'react-router-dom';
import { FileText, Shield, Clock, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">
          Estate Planning Made Simple
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Answer a few quick questions and download your personalized fillable PDF to complete at your own pace
        </p>
        <Link
          to="/wizard"
          className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
        >
          <FileText className="w-6 h-6 mr-2" />
          Start Questionnaire
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
          <Clock className="w-12 h-12 text-blue-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-white">Takes 2 Minutes</h3>
          <p className="text-gray-400">
            Answer a few simple questions to get started with your estate planning
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
          <Shield className="w-12 h-12 text-green-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-white">Stored Locally</h3>
          <p className="text-gray-400">
            Your answers are saved in your browser for privacy and security
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
          <CheckCircle className="w-12 h-12 text-orange-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-white">Fillable PDF</h3>
          <p className="text-gray-400">
            Download a customized form to complete in detail when you're ready
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-8 rounded-lg border border-gray-600">
        <h2 className="text-2xl font-semibold mb-4 text-white">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              1
            </div>
            <p className="text-sm text-gray-200 font-medium">Answer Quick Questions</p>
            <p className="text-xs text-gray-400 mt-2">Tell us your name and family details</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              2
            </div>
            <p className="text-sm text-gray-200 font-medium">Get Your PDF</p>
            <p className="text-xs text-gray-400 mt-2">Download a customized fillable form</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              3
            </div>
            <p className="text-sm text-gray-200 font-medium">Complete & Store</p>
            <p className="text-xs text-gray-400 mt-2">Fill it out at your pace and keep it safe</p>
          </div>
        </div>
      </div>
    </div>
  );
}
