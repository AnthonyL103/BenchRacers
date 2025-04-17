import Link from "next/link"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Car, Instagram, Twitter, Youtube, Facebook, BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-black">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Car className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Bench Racers</span>
            </div>
            <p className="text-sm text-gray-400">
              The ultimate platform for car enthusiasts to showcase, vote, and get inspired.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-gray-400 hover:text-primary">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-primary">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-primary">
                <Youtube className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-primary">
                <Facebook className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/explore" className="text-sm text-gray-400 hover:text-white">
                  Explore Builds
                </Link>
              </li>
              <li>
                <Link href="/rankings" className="text-sm text-gray-400 hover:text-white">
                  Rankings
                </Link>
              </li>
              <li>
                <Link href="/following" className="text-sm text-gray-400 hover:text-white">
                  Following
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-gray-400 hover:text-white">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-400 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-gray-400 hover:text-white">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-4">Newsletter</h3>
            <p className="text-sm text-gray-400 mb-4">Subscribe to get updates on new features and upcoming events.</p>
            <div className="flex gap-2">
              <Input placeholder="Your email" className="bg-gray-900" />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Bench Racers. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
