import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Heart, Flower2, Truck, Award } from "lucide-react";
import { motion } from "motion/react";

export function AboutPage() {
  const features = [
    {
      icon: Heart,
      title: "Passion for Flowers",
      description:
        "We are dedicated to bringing you the freshest and most beautiful flowers.",
    },
    {
      icon: Flower2,
      title: "Quality Guarantee",
      description:
        "Every arrangement is crafted with care using premium, hand-selected flowers.",
    },
    {
      icon: Truck,
      title: "Same-Day Delivery",
      description:
        "Order before 5pm for same-day delivery across the Philippines.",
    },
    {
      icon: Award,
      title: "Customer Satisfaction",
      description:
        "Your happiness is our priority. We stand behind every arrangement.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-pink-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2
                className="text-5xl mb-6"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                About Jean's Flower Shop
              </h2>
              <p className="text-gray-700 mb-4">
                At Jean’s Flower Shop, we believe that flowers speak a universal language of love, beauty, and emotion.
                Every arrangement we create is more than just a display of fresh blooms it is a reflection of care, thoughtfulness, and the heartfelt messages our customers wish to share. 
                Whether you are celebrating a birthday, sending warm wishes, commemorating a milestone, or offering comfort, our flowers are designed to make every moment meaningful.
              </p>
              <p className="text-gray-700 mb-4">
                Located along Dr. Meciano Road, beside M Lhuillier and in front of Iconcept in Dumaguete City,
                Jean’s Flower Shop has grown into a trusted place where the community turns to for quality floral arrangements. 
                With passion and creativity at the heart of everything we do, we take pride in delivering flowers that 
                not only look beautiful but also carry lasting significance.
              </p>
              <p className="text-gray-700">
                Our shop specializes in a wide range of floral services
                from classic bouquets and romantic arrangements to 
                wedding florals, event decorations, and sympathy tributes. 
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=600&fit=crop"
                alt="Flower shop"
                className="rounded-lg shadow-lg w-full"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl mb-12 text-center"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Why Choose Us
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF69B4]/10 rounded-full mb-4">
                    <Icon className="w-8 h-8 text-[#FF69B4]" />
                  </div>
                  <h4 className="mb-2">{feature.title}</h4>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h3
            className="text-3xl mb-4 text-center"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Our Story
          </h3>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-gray-700 mb-4">
              What started as a small flower cart in 2013 has grown into one of
              the most trusted flower shops in the Philippines. Jean's love for
              flowers and her commitment to customer satisfaction have been the
              foundation of our success.
            </p>
            <p className="text-gray-700 mb-4">
              Today, our team of skilled florists works tirelessly to create
              stunning arrangements that exceed expectations. We source the
              finest flowers from local and international growers, ensuring
              every bouquet is fresh and beautiful.
            </p>
            <p className="text-gray-700">
              Thank you for choosing Jean's Flower Shop. We look forward to
              helping you celebrate life's special moments with the perfect
              flowers.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#FF69B4] rounded-2xl p-12 text-center text-white"
          >
            <h3
              className="text-3xl mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Visit Our Shop
            </h3>
            <p className="mb-6">
              We'd love to see you in person! Visit our shop to explore our full
              collection.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <div>
                <p className="opacity-80">Address</p>
                <p>Dumaguete City, Negros Oriental</p>
              </div>
              <div>
                <p className="opacity-80">Hours</p>
                <p>Mon - Sun: 7am - 6pm</p>
              </div>
              <div>
                <p className="opacity-80">Phone</p>
                <p>(035) 402 0844</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}