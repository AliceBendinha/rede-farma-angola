const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="container py-6 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Todos os direitos autorais reservados — Desenvolvido por{" "}
          <span className="font-semibold text-foreground">Alice D'Costa</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;