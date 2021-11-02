import React, { memo, useCallback, useState } from 'react';
import cn from 'classnames';

import Tabs from '../Tabs';
import Tags from '../Tags';
import CodeExampleList from '../CodeExampleList';
import LinkList from '../LinkList';
import YouTubeVideo from '../YouTubeVideo';
import CollapsableDescription from '../CollapsableDescription';
import TimestampTimeline from '../TimestampTimeline';
import OverviewTimeline from './OverviewTimeline';
import * as css from './VideoSection.module.css';

const VideoSection = ({ track, video, trackPosition }) => {
  const { chapters } = track;
  const { topics, languages } = video;

  const [showTimeline, setShowTimeline] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [timestamp, setTimestamp] = useState();

  const updateTimestamp = useCallback((value) => {
    setTimestamp(value);
    setShowTimeline(false);
  }, []);

  let labels = ['OVERVIEW'];
  if (video.codeExamples && video.codeExamples.length > 0) {
    labels.push('CODE EXAMPLES');
  }
  labels = [...labels, ...video.groupLinks.map((g) => g.title.toUpperCase())];

  return (
    <div className={css.root}>
      <div className={css.subheading}>
        <h2>{video.title}</h2>
      </div>
      <div className={css.videoPlayer}>
        <div className={css.left}>
          <div className={css.details}>
            <Tags className={css.tags} heading="Languages" items={languages} />
            <Tags className={css.tags} heading="Topics" items={topics} />
          </div>
          <div className={css.video}>
            <YouTubeVideo
              containerClassName={css.videoWrapper}
              link={video.link}
              timestamp={timestamp}
            />
          </div>
        </div>
        <div className={cn(css.right, { [css.unCollapsed]: showTimeline })}>
          <div
            className={css.timelinesToggle}
            onClick={() => setShowTimeline((v) => !v)}
            onKeyPress={(e) => e.key === 'Enter' && setShowTimeline((v) => !v)}
            role="button"
            tabIndex="0"
            aria-label="Toggle timeline"
          />
          <div className={css.timelinesContent}>
            <div className={css.tabs}>
              <div className={cn(css.tab, { [css.selected]: !showTimestamps })}>
                <button onClick={() => setShowTimestamps(false)}>
                  Track overview
                </button>
              </div>
              <div className={cn(css.tab, { [css.selected]: showTimestamps })}>
                <button onClick={() => setShowTimestamps(true)}>
                  Video timestamps
                </button>
              </div>
            </div>
            <div className={css.timeline}>
              <TimestampTimeline
                className={cn(css.timestampsTimeline, {
                  [css.hide]: !showTimestamps
                })}
                variant="red"
                timestamps={video.timestamps}
                updateTimestamp={updateTimestamp}
              />
              <OverviewTimeline
                className={cn(css.overviewTimeline, {
                  [css.hide]: showTimestamps
                })}
                chapters={chapters}
                track={track}
                trackPosition={trackPosition}
              />
            </div>
          </div>
        </div>
      </div>
      <div className={css.sep}></div>
      <div>
        <Tabs className={css.aboutTabs} variant="red" labels={labels}>
          <CollapsableDescription
            className={css.description}
            expandedClassName={css.descriptionExpanded}
            variant="red"
            content={video.description}
            charLimit={150}
          />
          {video.codeExamples && video.codeExamples.length > 0 && (
            <div>
              <CodeExampleList examples={video.codeExamples} variant="red" />
            </div>
          )}
          {video.groupLinks.map((g, index) => (
            <LinkList links={g.links} variant="red" key={index} />
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default memo(VideoSection);
