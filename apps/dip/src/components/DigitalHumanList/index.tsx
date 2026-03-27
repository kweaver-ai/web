import { Col, type MenuProps, Row } from 'antd'
import { memo, useCallback } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import type { DigitalHuman } from '@/apis'
import ScrollBarContainer from '../ScrollBarContainer'
import EmployeeCard from './EmployeeCard'
// import EmployeeCard2 from './EmployeeCard2'
import { computeColumnCount, gap } from './utils'

interface DigitalHumanListProps {
  /** 数字员工列表数据 */
  digitalHumans: DigitalHuman[]
  /** 卡片点击回调 */
  onCardClick?: (digitalHuman: DigitalHuman) => void
  /** 卡片菜单点击回调 */
  menuItems?: (digitalHuman: DigitalHuman) => MenuProps['items']
}

/**
 * DigitalHumanList 数字员工列表组件
 */
const DigitalHumanList: React.FC<DigitalHumanListProps> = ({
  digitalHumans,
  onCardClick,
  menuItems,
}) => {
  /** 渲染卡片 */
  const renderCard = useCallback(
    (digitalHuman: DigitalHuman, width: number) => {
      return (
        <Col key={digitalHuman.id} style={{ width, minWidth: width }}>
          <EmployeeCard
            digitalHuman={digitalHuman}
            width={width}
            menuItems={menuItems?.(digitalHuman)}
            onCardClick={(digitalHuman) => onCardClick?.(digitalHuman)}
          />
        </Col>
      )
    },
    [onCardClick],
  )

  return (
    <div className="flex flex-col h-0 flex-1">
      <ScrollBarContainer className="p-2 pt-0 ml-[-8px] mb-[-8px] mr-[-24px]">
        <AutoSizer style={{ width: 'calc(100% - 8px)' }} disableHeight>
          {({ width }) => {
            const count = computeColumnCount(width)
            const calculatedCardWidth = width / count

            return (
              <Row gutter={[gap, gap]}>
                {digitalHumans.map((digitalHuman) => renderCard(digitalHuman, calculatedCardWidth))}
              </Row>
            )
          }}
        </AutoSizer>
      </ScrollBarContainer>
    </div>
  )
}

export default memo(DigitalHumanList)
