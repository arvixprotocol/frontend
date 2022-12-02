import type { ChakraProps } from '@chakra-ui/react';
import {
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Box,
  useColorModeValue,
} from '@chakra-ui/react';
import type { StyleProps } from '@chakra-ui/styled-system';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import type { RoutedTab } from './types';

import { useScrollDirection } from 'lib/contexts/scrollDirection';
import useIsMobile from 'lib/hooks/useIsMobile';
import useIsSticky from 'lib/hooks/useIsSticky';

import RoutedTabsMenu from './RoutedTabsMenu';
import useAdaptiveTabs from './useAdaptiveTabs';

const hiddenItemStyles: StyleProps = {
  position: 'absolute',
  top: '-9999px',
  left: '-9999px',
  visibility: 'hidden',
};

interface Props {
  tabs: Array<RoutedTab>;
  tabListProps?: ChakraProps;
  rightSlot?: React.ReactNode;
  stickyEnabled?: boolean;
}

const RoutedTabs = ({ tabs, tabListProps, rightSlot, stickyEnabled }: Props) => {
  const router = useRouter();
  const scrollDirection = useScrollDirection();
  const [ activeTabIndex, setActiveTabIndex ] = useState<number>(tabs.length + 1);

  useEffect(() => {
    if (router.isReady) {
      let tabIndex = 0;
      if (router.query.tab) {
        tabIndex = tabs.findIndex(({ id }) => id === router.query.tab);
        if (tabIndex < 0) {
          tabIndex = 0;
        }
      }
      setActiveTabIndex(tabIndex);
    }
  }, [ tabs, router ]);

  const isMobile = useIsMobile();
  const { tabsCut, tabsList, tabsRefs, listRef, rightSlotRef } = useAdaptiveTabs(tabs, isMobile);
  const isSticky = useIsSticky(listRef, 5, stickyEnabled);
  const listBgColor = useColorModeValue('white', 'black');

  const handleTabChange = React.useCallback((index: number) => {
    const nextTab = tabs[index];

    router.push(
      { pathname: router.asPath.split('?')[0], query: { tab: nextTab.id } },
      undefined,
      { shallow: true },
    );
  }, [ tabs, router ]);

  return (
    <Tabs
      variant="soft-rounded"
      colorScheme="blue"
      isLazy
      onChange={ handleTabChange }
      index={ activeTabIndex }
      position="relative"
    >
      <TabList
        marginBottom={{ base: 6, lg: 8 }}
        flexWrap="nowrap"
        whiteSpace="nowrap"
        ref={ listRef }
        overflowY="hidden"
        overflowX={{ base: 'auto', lg: undefined }}
        overscrollBehaviorX="contain"
        css={{
          'scroll-snap-type': 'x mandatory',
          // hide scrollbar
          '&::-webkit-scrollbar': { /* Chromiums */
            display: 'none',
          },
          '-ms-overflow-style': 'none', /* IE and Edge */
          'scrollbar-width': 'none', /* Firefox */
        }}
        bgColor={ listBgColor }
        transitionProperty="top,box-shadow,background-color,color"
        transitionDuration="slow"
        {
          ...(stickyEnabled ? {
            position: 'sticky',
            boxShadow: { base: isSticky ? 'md' : 'none', lg: 'none' },
            top: { base: scrollDirection === 'down' ? `0px` : `106px`, lg: 0 },
            zIndex: { base: 'sticky2', lg: 'docked' },
          } : { })
        }
        { ...tabListProps }
      >
        { tabsList.map((tab, index) => {
          if (!tab.id) {
            return (
              <RoutedTabsMenu
                key="menu"
                tabs={ tabs }
                activeTab={ tabs[activeTabIndex] }
                tabsCut={ tabsCut }
                isActive={ activeTabIndex >= tabsCut }
                styles={ tabsCut < tabs.length ?
                  // initially our cut is 0 and we don't want to show the menu button too
                  // but we want to keep it in the tabs row so it won't collapse
                  // that's why we only change opacity but not the position itself
                  { opacity: tabsCut === 0 ? 0 : 1 } :
                  hiddenItemStyles
                }
                onItemClick={ handleTabChange }
                buttonRef={ tabsRefs[index] }
              />
            );
          }

          return (
            <Tab
              key={ tab.id }
              ref={ tabsRefs[index] }
              { ...(index < tabsCut ? {} : hiddenItemStyles) }
              scrollSnapAlign="start"
            >
              { tab.title }
            </Tab>
          );
        }) }
        { rightSlot ? <Box ref={ rightSlotRef } ml="auto" > { rightSlot } </Box> : null }
      </TabList>
      <TabPanels>
        { tabsList.map((tab) => <TabPanel padding={ 0 } key={ tab.id }>{ tab.component }</TabPanel>) }
      </TabPanels>
    </Tabs>
  );
};

export default React.memo(RoutedTabs);
