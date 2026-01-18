import { openBrowserAsync } from 'expo-web-browser';
import { Platform, Pressable, Text, type TextProps } from 'react-native';
import { Link } from 'expo-router';

type Props = {
  href: string;
  children: React.ReactNode;
} & Omit<TextProps, 'children'>;

export function ExternalLink({ href, children, ...rest }: Props) {
  if (Platform.OS === 'web') {
    return (
      <Link href={href as any} target="_blank">
        {children}
      </Link>
    );
  }

  return (
    <Pressable
      onPress={async () => {
        await openBrowserAsync(href);
      }}>
      <Text {...rest}>{children}</Text>
    </Pressable>
  );
}
