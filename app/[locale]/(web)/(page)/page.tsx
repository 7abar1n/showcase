import { fetchActualities } from '@/app/[locale]/(web)/actions';

import { getClient } from '@/lib/utils/urqlRscClient';

import { GetWebSliderList } from '@/graphql/web/slider';
import { ContentLayout } from '@/components/web/layout/contentLayout';
import Slider from '@/components/web/slider/Slider';
import ShopWidget from '@/components/web/widgets/shop';
import ActualitySection from '@/components/web/actualities/actualitySection';
import PlayWidget from '@/components/web/widgets/play';
import { ProgrammeWidget } from '@/components/web/widgets/programmeWidget';
import RepertoireWidget from '@/components/web/widgets/repertoireWidget';
import { SliderPage } from '@/graphql/generated/graphql';
import { mapPageSliderProps } from '@/lib/utils/sliderUtils';
import { Metadata } from 'next';
import { pageMetadata } from '@/app/shared-metadata';

export const metadata: Metadata = pageMetadata({
  title: '....',
});

const Page = async () => {
  const actualityData = await fetchActualities({ take: 4, after: null });
  const { data: sliderData } = await getClient().query(GetWebSliderList, {
    page: SliderPage.Homepage,
  });

  const slides = mapPageSliderProps(sliderData?.slidesForWeb.edges);

  return (
    <>
      <Slider slides={slides} options={{ active: true, loop: true }} />
      <ContentLayout
        firstSection={<ProgrammeWidget first={4} />}
        sideSections={
          <>
            <RepertoireWidget />
            <PlayWidget />
            <ShopWidget />
          </>
        }
      >
        <ActualitySection initialData={actualityData} />
      </ContentLayout>
    </>
  );
};

export default Page;
