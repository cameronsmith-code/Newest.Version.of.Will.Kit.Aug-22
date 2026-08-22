import { Mail, Github, Twitter, Linkedin } from 'lucide-react';

export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-white mb-6">Get In Touch</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-8 rounded-lg shadow-md border border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-white">Send us a message</h2>

          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Your message..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>

        <div>
          <div className="bg-gray-800 p-8 rounded-lg shadow-md mb-6 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-white">Contact Information</h2>

            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="w-6 h-6 text-blue-400 mr-3" />
                <div>
                  <p className="font-medium text-white">Email</p>
                  <p className="text-gray-400">hello@example.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-8 rounded-lg shadow-md border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-white">Follow Us</h2>

            <div className="flex space-x-4">
              <a
                href="#"
                className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors text-gray-400"
              >
                <Twitter className="w-6 h-6" />
              </a>
              <a
                href="#"
                className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-900 hover:text-white transition-colors text-gray-400"
              >
                <Github className="w-6 h-6" />
              </a>
              <a
                href="#"
                className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-blue-700 hover:text-white transition-colors text-gray-400"
              >
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
