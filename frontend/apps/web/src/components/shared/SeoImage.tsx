import Image, { type ImageProps } from "next/image";

type SeoImageProps = Omit<ImageProps, "loading"> & {
  /** 是否优先加载（首屏 LCP 图片应设为 true） */
  priority?: boolean;
  /** 是否启用懒加载（默认 true，首屏图片设 false） */
  lazy?: boolean;
};

/**
 * SeoImage — SEO 友好的图片组件
 *
 * 基于 next/image 封装，默认开启懒加载和异步解码。
 * 首屏 LCP 图片通过 priority={true} 提升加载优先级。
 *
 * - 自动生成 srcset 和 sizes 属性，适配响应式
 * - 自动转换为 AVIF/WebP 格式
 * - 懒加载减少首屏带宽
 * - alt 属性增强可访问性和 SEO
 */
export default function SeoImage({
  priority = false,
  lazy = true,
  alt = "",
  ...props
}: SeoImageProps) {
  return (
    <Image
      {...props}
      alt={alt}
      priority={priority}
      loading={priority ? undefined : lazy ? "lazy" : "eager"}
      decoding="async"
    />
  );
}
