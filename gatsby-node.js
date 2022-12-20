const { schema } = require('./node-scripts/schema');
const {
  createVideoRelatedNode,
  createTrackRelatedNode,
  createTalkRelatedNode,
  createFAQRelatedNode,
  createFAQImageNode,
  createVideoCoverImageNode,
  createTrackCoverImageNode,
  createTalkCoverImageNode,
  createGuideRelatedNode,
  createGuideCoverImageNode,
  createHomepageRelatedNodes,
  createAboutPageRelatedNodes,
  create404PageRelatedNodes,
  createTracksPageRelatedNodes,
  createChallengesPageRelatedNodes,
  createGuidesPageRelatedNodes,
  createAboutPageCoverImageNode
} = require('./node-scripts/node-generation');
const {
  createTrackVideoPages,
  createTracksPages,
  createChallengesPages,
  createGuidePages
} = require('./node-scripts/page-generation');
const set = require('lodash/set');

exports.createSchemaCustomization = ({ actions }) =>
  actions.createTypes(schema);

exports.onCreateNode = ({
  node,
  actions,
  createNodeId,
  createContentDigest,
  getNode
}) => {
  const { createNode, createNodeField } = actions;
  const { owner, mediaType } = node.internal;
  const parent = getNode(node.parent);

  if (owner === 'gatsby-transformer-json') {
    /**
      Turn JSON files into Tracks, Video and Showcase Contribution nodes
    **/
    if (parent.sourceInstanceName === 'challenges')
      createVideoRelatedNode(
        createNode,
        createNodeId,
        createContentDigest,
        node,
        parent,
        'Challenge'
      );
    else if (parent.sourceInstanceName === 'guest-tutorials')
      createVideoRelatedNode(
        createNode,
        createNodeId,
        createContentDigest,
        node,
        parent,
        'GuestTutorial'
      );
    else if (parent.sourceInstanceName === 'videos')
      createVideoRelatedNode(
        createNode,
        createNodeId,
        createContentDigest,
        node,
        parent,
        'Video'
      );
    else if (
      parent.sourceInstanceName === 'main-tracks' ||
      parent.sourceInstanceName === 'side-tracks'
    )
      createTrackRelatedNode(
        createNode,
        createNodeId,
        createContentDigest,
        node,
        parent,
        parent.sourceInstanceName
      );
    else if (parent.sourceInstanceName === 'faqs')
      createFAQRelatedNode(
        createNode,
        createNodeId,
        createContentDigest,
        node,
        parent
      );
    else if (parent.sourceInstanceName === 'talks')
      createTalkRelatedNode(
        createNode,
        createNodeId,
        createContentDigest,
        node,
        parent
      );
    else if (parent.sourceInstanceName === 'homepage-data')
      createHomepageRelatedNodes(
        createNode,
        createNodeId,
        createContentDigest,
        node,
        parent
      );
    else if (parent.sourceInstanceName === 'about-page-data')
      createAboutPageRelatedNodes(
        createNode,
        createNodeId,
        createContentDigest,
        node,
        parent
      );
    else if (parent.sourceInstanceName === '404-page-data')
      create404PageRelatedNodes(
        createNode,
        createNodeId,
        createContentDigest,
        node,
        parent
      );
    else if (parent.sourceInstanceName === 'tracks-page-data')
      createTracksPageRelatedNodes(
        createNode,
        createNodeId,
        createContentDigest,
        node,
        parent
      );
    else if (parent.sourceInstanceName === 'challenges-page-data')
      createChallengesPageRelatedNodes(
        createNode,
        createNodeId,
        createContentDigest,
        node,
        parent
      );
    else if (parent.sourceInstanceName === 'guides')
      createGuidesPageRelatedNodes(
        createNode,
        createNodeId,
        createContentDigest,
        node,
        parent
      );
  } else if (
    owner === 'gatsby-plugin-mdx' &&
    parent.sourceInstanceName === 'guides'
  ) {
    createGuideRelatedNode(
      createNode,
      createNodeId,
      createContentDigest,
      node,
      parent
    );

    // no more slugs in mdx v2
    createNodeField({
      node,
      name: 'slug',
      value: parent.name
    });
  } else if (
    owner === 'gatsby-source-filesystem' &&
    mediaType !== undefined &&
    mediaType.includes('image')
  ) {
    /**
      Turn image files into CoverImages for Tracks, Video and Showcase Contribution nodes
    **/

    if (
      node.sourceInstanceName === 'videos' ||
      node.sourceInstanceName === 'guest-tutorials' ||
      node.sourceInstanceName === 'challenges'
    ) {
      createVideoCoverImageNode(
        createNode,
        createNodeId,
        createContentDigest,
        node,
        node.sourceInstanceName
      );
    } else if (
      node.sourceInstanceName === 'main-tracks' ||
      node.sourceInstanceName === 'side-tracks'
    ) {
      createTrackCoverImageNode(
        createNode,
        createNodeId,
        createContentDigest,
        node,
        node.sourceInstanceName
      );
    } else if (node.sourceInstanceName === 'faqs') {
      createFAQImageNode(createNode, createNodeId, createContentDigest, node);
    } else if (node.sourceInstanceName === 'talks') {
      createTalkCoverImageNode(
        createNode,
        createNodeId,
        createContentDigest,
        node
      );
    } else if (node.sourceInstanceName === 'guides') {
      createGuideCoverImageNode(
        createNode,
        createNodeId,
        createContentDigest,
        node
      );
    } else if (node.sourceInstanceName === 'about-page-data') {
      createAboutPageCoverImageNode(
        createNode,
        createNodeId,
        createContentDigest,
        node
      );
    }
  }
};

exports.createPages = async function ({ actions, graphql }) {
  const { createPage } = actions;
  await createTrackVideoPages(graphql, createPage);
  await createTracksPages(graphql, createPage);
  await createChallengesPages(graphql, createPage);
  await createGuidePages(graphql, createPage);
};

const tagResolver = async (source, context, type) => {
  const tags = new Set();

  // track.videos
  let videoIds = source.videos ?? [];

  // track.chapters.videos
  if (source.chapters) {
    const chapters = await context.nodeModel.getNodesByIds({
      ids: source.chapters,
      type: 'Chapter'
    });

    for (let chapter of chapters) {
      if (chapter.videos) {
        videoIds = [...videoIds, ...chapter.videos];
      }
    }
  }

  // fetch all video nodes we found
  const allVideos = await context.nodeModel.getNodesByIds({
    ids: videoIds,
    type: 'Video'
  });

  // extract and dedupe tags
  for (let video of allVideos) {
    if (video[type]) {
      video[type].forEach((v) => tags.add(v));
    }
  }

  return [...tags];
};

const filterByTagsResolver = async (
  args,
  context,
  type,
  sortField,
  sortOrder
) => {
  const { language, topic, skip, limit } = args;

  const query = {};

  set(query, 'sort.order', [sortOrder]);
  set(query, 'sort.fields', [sortField]);

  if (language) set(query, 'filter.languages.eq', language);
  if (topic) set(query, 'filter.topics.eq', topic);
  if (skip) set(query, 'skip', skip);
  if (limit) set(query, 'limit', limit);

  const { entries } = await context.nodeModel.findAll({
    type,
    query
  });

  return entries;
};

const showcaseResolver = async (source, args, context, info) => {
  const query = {};

  set(query, 'filter.video.id.eq', source.id);
  set(query, 'sort.order', ['ASC']);
  set(query, 'sort.fields', ['name']);

  const { entries } = await context.nodeModel.findAll({
    type: 'Contribution',
    query
  });

  return entries;
};

exports.createResolvers = ({ createResolvers }) => {
  const resolvers = {
    Track: {
      topics: {
        type: ['String'],
        resolve: async (source, args, context, info) =>
          await tagResolver(source, context, 'topics')
      },
      languages: {
        type: ['String'],
        resolve: async (source, args, context, info) =>
          await tagResolver(source, context, 'languages')
      }
    },
    Challenge: {
      showcase: {
        type: ['Contribution'],
        resolve: showcaseResolver
      }
    },
    Video: {
      showcase: {
        type: ['Contribution'],
        resolve: showcaseResolver
      }
    },
    Query: {
      tracksPaginatedFilteredByTags: {
        type: ['Track'],
        resolve: async (source, args, context, info) =>
          await filterByTagsResolver(args, context, 'Track', 'order', 'ASC')
      },
      challengesPaginatedFilteredByTags: {
        type: ['Challenge'],
        resolve: async (source, args, context, info) =>
          await filterByTagsResolver(args, context, 'Challenge', 'date', 'DESC')
      }
    }
  };
  createResolvers(resolvers);
};
