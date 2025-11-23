const Footer = () => {
  const links = ["Features", "Pricing", "Security", "Contact", "Terms of Service", "Privacy Policy"];

  return (
    <footer className="bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} CryoPay. All rights reserved.
          </p>
          <div className="flex space-x-6">
            {links.map(link => (
              <a key={link} href="#" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;