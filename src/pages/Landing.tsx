import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D5016' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-12">
              <img
                src="/whatsapp_image_2025-10-29_at_11.28.27.jpeg"
                alt="Organitto - The Organic Choice"
                className="h-24 md:h-32 w-auto object-contain drop-shadow-2xl logo-transparent"
              />
            </div>

            <p className="text-xl md:text-2xl text-secondary font-medium mb-3 tracking-wide">
              Natural Business Management
            </p>

            <p className="text-lg md:text-xl text-dark-brown/70 mb-12 max-w-2xl mx-auto leading-relaxed">
              Harmonize your Ayurvedic practice with intuitive tools designed for mindful business growth
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button
                onClick={() => navigate('/register')}
                className="group relative px-8 py-4 bg-primary text-cream font-semibold text-lg rounded-full shadow-soft-lg hover:shadow-soft transition-all duration-300 hover:scale-105 active:scale-95 min-w-[200px]"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-sage opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
              </button>

              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-transparent text-primary font-semibold text-lg rounded-full border-2 border-primary hover:bg-primary hover:text-cream transition-all duration-300 hover:scale-105 active:scale-95 min-w-[200px]"
              >
                Sign In
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
                <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Leaf className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-primary mb-2">
                  Natural Flow
                </h3>
                <p className="text-dark-brown/70 leading-relaxed">
                  Manage your practice with tools that respect the natural rhythm of Ayurvedic care
                </p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Leaf className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-primary mb-2">
                  Holistic Insights
                </h3>
                <p className="text-dark-brown/70 leading-relaxed">
                  Gain comprehensive visibility into your business health and growth patterns
                </p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Leaf className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-primary mb-2">
                  Mindful Growth
                </h3>
                <p className="text-dark-brown/70 leading-relaxed">
                  Scale your practice sustainably while maintaining the essence of Ayurveda
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>
    </div>
  );
}
