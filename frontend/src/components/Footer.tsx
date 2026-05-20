import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CV</span>
              </div>
              <span className="text-lg font-bold text-white">CVCraft</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              The smarter way to hire and get hired. AI-powered CV builder, job search, and talent discovery.
            </p>
          </div>

          {/* For Job Seekers */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">For Job Seekers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link></li>
              <li><Link href="/cv/generate" className="hover:text-white transition-colors">AI CV Builder</Link></li>
              <li><Link href="/jd/search" className="hover:text-white transition-colors">JD Search</Link></li>
              <li><Link href="/auth/register?role=CANDIDATE" className="hover:text-white transition-colors">Create Account</Link></li>
            </ul>
          </div>

          {/* For Recruiters */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">For Recruiters</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/candidates" className="hover:text-white transition-colors">Browse Candidates</Link></li>
              <li><Link href="/jobs/post" className="hover:text-white transition-colors">Post a Job</Link></li>
              <li><Link href="/companies" className="hover:text-white transition-colors">Company Profiles</Link></li>
              <li><Link href="/auth/register?role=RECRUITER" className="hover:text-white transition-colors">Recruiter Sign Up</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Career Blog</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2024 CVCraft. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">Powered by AI</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full" />
            <span className="text-xs text-gray-500">Spring Boot + Next.js</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
