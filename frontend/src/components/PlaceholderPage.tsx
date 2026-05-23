const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <h2 className="text-[25px] font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground">This section is under development.</p>
    </div>
  </div>
);

export default PlaceholderPage;
