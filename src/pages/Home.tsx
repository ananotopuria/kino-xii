import Hero from "../components/home/Hero";
import NowPlaying from "../components/home/NowPlaying";
import ComingSoon from "../components/home/ComingSoon";

const Home = () => {
  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <Hero />
      <NowPlaying />
      <ComingSoon />
    </main>
  );
};

export default Home;
