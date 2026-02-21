import Container from "@/components/container/Container";

export default function Today() {
  return (
    <Container title="Today">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Your daily overview will appear here</p>
        </div>
      </div>
    </Container>
  );
}
