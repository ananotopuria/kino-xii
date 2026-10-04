import Hero from "../components/home/Hero";
import NowPlaying from "../components/home/NowPlaying";
import ComingSoon from "../components/home/ComingSoon";
import RecentlyViewed from "../components/home/RecentlyViewed";

const Home = () => {
  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <Hero />
      <RecentlyViewed />
      <NowPlaying />
      <ComingSoon />
    </main>
  );
};

export default Home;
