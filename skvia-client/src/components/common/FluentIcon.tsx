import React from 'react';
import {
  WrenchRegular,
  BoxRegular,
  SettingsRegular,
  PeopleRegular,
  BoardRegular,
  ClipboardTaskRegular,
  PersonAccountsRegular,
  BuildingBankRegular,
  ToolboxRegular,
  BoxCheckmarkRegular,
  TagRegular,
  ArrowRepeatAllRegular,
  RulerRegular,
  FolderOpenRegular,
  ShoppingBagRegular,
  TasksAppRegular,
  WarningRegular,
  PeopleCommunityRegular,
  ClockRegular,
  MoneyRegular,
  SearchRegular,
  WeatherSunnyRegular,
  WeatherMoonRegular,
  NavigationRegular,
  AppsRegular,
  ChevronDownRegular,
  ChevronRightRegular,
  ChevronUpDownRegular,
  CheckmarkRegular,
  AddRegular,
  EditRegular,
  DeleteRegular,
  ArrowClockwiseRegular,
  ShareRegular,
  ArrowDownloadRegular,
  TableRegular,
  DismissRegular,
  QuestionCircleRegular,
  AlertRegular,
  MoreHorizontalRegular,
  DocumentRegular,
  ShieldRegular,
  VehicleCarRegular,
  DataPieRegular,
  EyeRegular,
  GridRegular,
  TableEditRegular,
  DataFunnelRegular,
} from '@fluentui/react-icons';

interface FluentIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
  fontSize?: number | string;
}

export const FluentIcon: React.FC<FluentIconProps> = ({ name, className, style, fontSize }) => {
  const iconProps = { className, style: { fontSize, ...style } };

  switch (name) {
    case 'Wrench':
      return <WrenchRegular {...iconProps} />;
    case 'Box':
      return <BoxRegular {...iconProps} />;
    case 'Settings':
      return <SettingsRegular {...iconProps} />;
    case 'People':
      return <PeopleRegular {...iconProps} />;
    case 'Board':
      return <BoardRegular {...iconProps} />;
    case 'ClipboardTask':
      return <ClipboardTaskRegular {...iconProps} />;
    case 'PersonAccounts':
      return <PersonAccountsRegular {...iconProps} />;
    case 'BuildingBank':
      return <BuildingBankRegular {...iconProps} />;
    case 'PersonToolbox':
      return <ToolboxRegular {...iconProps} />;
    case 'BoxCheckmark':
      return <BoxCheckmarkRegular {...iconProps} />;
    case 'Barcode':
      return <TagRegular {...iconProps} />;
    case 'ArrowRepeatAll':
      return <ArrowRepeatAllRegular {...iconProps} />;
    case 'Ruler':
      return <RulerRegular {...iconProps} />;
    case 'FolderOpen':
      return <FolderOpenRegular {...iconProps} />;
    case 'ShoppingBag':
      return <ShoppingBagRegular {...iconProps} />;
    case 'TaskList':
      return <TasksAppRegular {...iconProps} />;
    case 'Warning':
      return <WarningRegular {...iconProps} />;
    case 'PeopleCommunity':
      return <PeopleCommunityRegular {...iconProps} />;
    case 'Clock':
      return <ClockRegular {...iconProps} />;
    case 'Money':
      return <MoneyRegular {...iconProps} />;
    case 'Search':
      return <SearchRegular {...iconProps} />;
    case 'WeatherSunny':
      return <WeatherSunnyRegular {...iconProps} />;
    case 'WeatherMoon':
      return <WeatherMoonRegular {...iconProps} />;
    case 'Navigation':
      return <NavigationRegular {...iconProps} />;
    case 'Apps':
      return <AppsRegular {...iconProps} />;
    case 'ChevronDown':
      return <ChevronDownRegular {...iconProps} />;
    case 'ChevronUpDown':
      return <ChevronUpDownRegular {...iconProps} />;
    case 'ChevronRight':
      return <ChevronRightRegular {...iconProps} />;
    case 'Checkmark':
      return <CheckmarkRegular {...iconProps} />;
    case 'Add':
      return <AddRegular {...iconProps} />;
    case 'Edit':
      return <EditRegular {...iconProps} />;
    case 'Delete':
      return <DeleteRegular {...iconProps} />;
    case 'ArrowClockwise':
      return <ArrowClockwiseRegular {...iconProps} />;
    case 'Share':
      return <ShareRegular {...iconProps} />;
    case 'ArrowDownload':
      return <ArrowDownloadRegular {...iconProps} />;
    case 'Filter':
    case 'Funnel':
      return <DataFunnelRegular {...iconProps} />;
    case 'TableEdit':
    case 'ColumnEdit':
      return <TableEditRegular {...iconProps} />;
    case 'Table':
      return <TableRegular {...iconProps} />;
    case 'Dismiss':
      return <DismissRegular {...iconProps} />;
    case 'QuestionCircle':
      return <QuestionCircleRegular {...iconProps} />;
    case 'Alert':
      return <AlertRegular {...iconProps} />;
    case 'MoreHorizontal':
      return <MoreHorizontalRegular {...iconProps} />;
    case 'Shield':
      return <ShieldRegular {...iconProps} />;
    case 'Car':
      return <VehicleCarRegular {...iconProps} />;
    case 'Chart':
      return <DataPieRegular {...iconProps} />;
    case 'Eye':
      return <EyeRegular {...iconProps} />;
    case 'Grid':
      return <GridRegular {...iconProps} />;
    default:
      return <DocumentRegular {...iconProps} />;
  }
};
