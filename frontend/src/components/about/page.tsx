import Link from "next/link"
import Image from "next/image"
import { Navbar } from "../navbar"
import { Footer } from "../footer"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { ArrowRight, BookOpen, Mail, Users } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <section className="py-20 bg-gray-950">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge className="text-lg py-1.5 px-3 bg-primary text-white">About Us</Badge>
                <h1 className="text-4xl md:text-5xl font-bold">The Ultimate Car Enthusiast Platform</h1>
                <p className="text-xl text-gray-300">
                  Bench Racers was created by car enthusiasts for car enthusiasts. Our mission is to build the most
                  engaging community for showcasing, rating, and discovering amazing car builds.
                </p>
                <div className="flex gap-4">
                  <Link href="/explore">
                    <Button size="lg" className="gap-2">
                      Explore Builds
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="#magazine">
                    <Button size="lg" variant="outline" className="gap-2">
                      <BookOpen className="h-5 w-5" />
                      Our Magazine
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative h-[400px] rounded-xl overflow-hidden">
                <Image src="/placeholder.svg?height=800&width=1200" alt="Car meet" fill className="object-cover" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Story</h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                From passionate discussions about cars to creating the platform that brings enthusiasts together
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">The Beginning</h3>
                  <p className="text-gray-400">
                    It all started in 2023 when a group of car enthusiasts realized there wasn't a dedicated platform
                    for showcasing and rating custom car builds. The term "bench racing" - discussing and comparing cars
                    without actually racing them - inspired our name.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-primary"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5Z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Building the Platform</h3>
                  <p className="text-gray-400">
                    We spent months developing a platform that would make it easy for enthusiasts to showcase their
                    builds, get feedback, and discover inspiration. Our focus was on creating a visual, engaging
                    experience that celebrates the passion and craftsmanship in car culture.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">The Magazine</h3>
                  <p className="text-gray-400">
                    As our community grew, we realized the amazing stories behind these builds deserved to be told.
                    That's when we launched Bench Racers Magazine - a digital and print publication featuring the best
                    builds and the passionate people behind them.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="magazine" className="py-20 bg-gray-950">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 relative h-[500px] rounded-xl overflow-hidden">
                <Image
                  src="/placeholder.svg?height=1000&width=800"
                  alt="Magazine cover"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="order-1 md:order-2 space-y-6">
                <Badge className="text-lg py-1.5 px-3 bg-primary text-white">The Magazine</Badge>
                <h2 className="text-4xl font-bold">Bench Racers Magazine</h2>
                <p className="text-xl text-gray-300">
                  Our quarterly magazine showcases the best builds from our platform, with in-depth features, interviews
                  with builders, and technical deep-dives.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 text-primary"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold">In-depth Features</h3>
                      <p className="text-gray-400">
                        Detailed stories about the most impressive builds and their creators
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 text-primary"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold">Technical Articles</h3>
                      <p className="text-gray-400">
                        Expert advice and insights on modifications and performance upgrades
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 text-primary"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold">Community Spotlights</h3>
                      <p className="text-gray-400">
                        Highlighting car meets, events, and the people who make our community special
                      </p>
                    </div>
                  </div>
                </div>
                <Button size="lg" className="gap-2">
                  Subscribe to Magazine
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Meet the Team</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-16">
              The passionate car enthusiasts behind Bench Racers
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { name: "Alex Johnson", role: "Founder & CEO", image: "/placeholder.svg?height=400&width=400" },
                { name: "Sarah Chen", role: "Head of Design", image: "/placeholder.svg?height=400&width=400" },
                { name: "Mike Rodriguez", role: "Technical Lead", image: "/placeholder.svg?height=400&width=400" },
                { name: "Jamie Williams", role: "Community Manager", image: "/placeholder.svg?height=400&width=400" },
              ].map((member, i) => (
                <div key={i} className="text-center">
                  <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden mb-4">
                    <Image src={member.image || "/placeholder.svg"} alt={member.name} fill className="object-cover" />
                  </div>
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  <p className="text-gray-400">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary/10">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Get in Touch</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Have questions or want to collaborate? We'd love to hear from you!
            </p>
            <Link href="/contact">
              <Button size="lg" className="gap-2">
                <Mail className="h-5 w-5" />
                Contact Us
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
