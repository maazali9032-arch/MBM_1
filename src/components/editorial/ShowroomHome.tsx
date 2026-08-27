import { CinematicHero } from '../cinematic/CinematicHero';
import { CollectionShowcase } from './CollectionShowcase';
import { ReviewsSection } from './ReviewsSection';
import { BranchesSection } from './BranchesSection';

export const ShowroomHome = () => {
  return (
    <>
      <CinematicHero />
      <main className="bg-white text-black">
        <CollectionShowcase />
        <ReviewsSection />
        <BranchesSection />
      </main>
    </>
  );
};
export default ShowroomHome;
