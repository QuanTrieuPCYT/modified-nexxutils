import { findByProps, findByStoreName } from "@vendetta/metro";
import {
  i18n,
  React,
  ReactNative as RN,
  stylesheet,
} from "@vendetta/metro/common";
import { before } from "@vendetta/patcher";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";

import { TextStyleSheet } from "$/types";

import { Module, ModuleCategory } from "../stuff/Module";

import { logger } from "@vendetta";

const SpotifyStore = findByStoreName("SpotifyStore");
const SelectedChannelStore = findByStoreName("SelectedChannelStore");
const dialog = findByProps("show", "confirm", "close");
// const actionSheetManager = findByProps("hideActionSheet");

const { sendMessage } = findByProps("sendMessage", "revealMessage");
const { getText, setText } = findByProps(
  "openSystemKeyboard",
  "getText",
  "setText",
);

const sendInvite = () => {
  const activity = SpotifyStore.getActivity();
  if (!activity?.party?.id) return;

  const channel = SelectedChannelStore.getChannelId();
  sendMessage(
    channel,
    {
      content: getText(channel),
      tts: false,
      invalidEmojis: [],
      validNonShortcutEmojis: [],
    },
    true,
    {
      activityAction: {
        activity,
        type: 3,
      },
    },
  );

  if (setText.length >= 2) setText(channel, "");
  else setText("");
};

const sendConfirmDialog = () => {
/*
const hideASInterval = setInterval(() => actionSheetManager.hideActionSheet(), 100);
            setTimeout(() => clearInterval(hideASInterval), 3000);
*/
dialog.show({
    title: "Confirmation",
    body: "Do you want to send a Spotify invite?",
    confirmText: "Yes",
    cancelText: "No",
    confirmColor: "brand",
    onConfirm: () => { sendInvite(); },
    // onCancel: () => void clearInterval(hideASInterval)
});
};

const styles = stylesheet.createThemedStyleSheet({
  disabledIcon: {
    tintColor: semanticColors.INTERACTIVE_MUTED,
  },
  text: {
    ...TextStyleSheet["text-md/semibold"],
    color: semanticColors.TEXT_NORMAL,
  },
  disabledText: {
    color: semanticColors.TEXT_MUTED,
  },
});

export default new Module({
  id: "send-spotify-invite",
  label: "Send Spotify invite",
  sublabel: "Adds an option to send a Spotify Listen Along invite in chat",
  category: ModuleCategory.Useful,
  icon: getAssetIDByName("ic_spotify_white_16px"),
  handlers: {
    onStart() {
      this.patches.add(
        //@ts-expect-error not in RN typings
        before("render", RN.Pressable.type, ([a]) => {
          if (a.accessibilityLabel === i18n.Messages.FILES) {
            const disabled = !SpotifyStore.getActivity()?.party?.id;
            a.disabled = disabled;
            a.onPress = sendConfirmDialog;

            const textComp = findInReactTree(
              a.children,
              (x) => x?.children === i18n.Messages.FILES,
            );
            if (textComp) {
              textComp.children = "Invite";
              textComp.style = [styles.text, disabled && styles.disabledText];
            }

            const iconComp = findInReactTree(a.children, (x) =>
              x?.props?.style?.find((y: any) => y?.tintColor),
            );
            if (iconComp)
              iconComp.type = () =>
                React.createElement(RN.Image, {
                  source: getAssetIDByName("ic_spotify_white_16px"),
                  resizeMode: "cover",
                  style: [
                    {
                      width: 20,
                      height: 20,
                    },
                    RN.StyleSheet.flatten(iconComp.props.style),
                    disabled && styles.disabledIcon,
                  ],
                });
          }
        }),
      );
    },
    onStop() {},
  },
});
