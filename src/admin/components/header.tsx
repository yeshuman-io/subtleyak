import { Heading, Button, Text, DropdownMenu } from "@medusajs/ui"
import React from "react"
import { Link, LinkProps } from "react-router-dom"

export type HeadingProps = {
  title: string
  subtitle?: string
  actions?: (
    {
      type: "button",
      props: React.ComponentProps<typeof Button>
      link?: LinkProps
    } |  
    {
      type: "dropdown"
      props: React.ComponentProps<typeof DropdownMenu>
    } |
    {
      type: "custom"
      children: React.ReactNode
    }
  )[]
}

export const Header = ({
  title,
  subtitle,
  actions = [],
}: HeadingProps) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <Heading level="h2">{title}</Heading>
        {subtitle && (
          <Text className="text-ui-fg-subtle" size="small">
            {subtitle}
          </Text>
        )}
      </div>
      {actions.length > 0 && (
        <div className="flex items-center justify-center gap-x-2">
          {actions.map((action, index) => (
            <React.Fragment key={index}>
              {action.type === "button" && (
                action.link ? (
                  <Link {...action.link}>
                    <Button {...action.props} size={action.props.size || "small"} />
                  </Link>
                ) : (
                  <Button {...action.props} size={action.props.size || "small"} />
                )
              )}
              {action.type === "dropdown" && (
                <DropdownMenu {...action.props} />
              )}
              {action.type === "custom" && action.children}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}